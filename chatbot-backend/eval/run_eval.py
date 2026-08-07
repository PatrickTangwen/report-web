#!/usr/bin/env python3
"""Golden-set evaluation runner and grader.

Targets two live answer paths (spec: docs/spec-agent-refactor-2026-08-07.md):

    single_call  POST /paper/question  (full-paper single LLM call —
                 only before the #48 cutover; preserved under the
                 paper-question-single-call git tag)
    agent        agent.run_agent       (bounded tool-use loop)

The legacy intent-router path (`POST /chat`) was deleted in #53; its
baseline numbers live in the committed eval/results/router-*.json files
captured before the deletion.

Usage (from chatbot-backend/, with LLM_Key_Deepseek in the repo root .env):

    python eval/run_eval.py run --path agent
    python eval/run_eval.py grade eval/results/<run-file>.json

`run` executes the golden set against one path and writes a raw results
file; `grade` adds LLM-as-judge verdicts (DeepSeek, temperature 0, written
rubric) plus judge-free metrics and writes `<run-file>-graded.json`.
"""

import argparse
import asyncio
import json
import sys
import time
from datetime import datetime
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

import os

from dotenv import load_dotenv

load_dotenv(BACKEND.parent / ".env")

import httpx
from openai import OpenAI

EVAL_DIR = Path(__file__).resolve().parent
GOLDEN_PATH = EVAL_DIR / "golden_set.jsonl"
RESULTS_DIR = EVAL_DIR / "results"
MODEL = "deepseek-chat"


def load_golden(path):
    items = []
    with open(path) as file:
        for line in file:
            if line.strip():
                items.append(json.loads(line))
    return items


def counting_client(inner):
    """Wrap an OpenAI client so every chat.completions.create is counted."""
    counter = {"llm_calls": 0}

    class _Completions:
        @staticmethod
        def create(**kwargs):
            counter["llm_calls"] += 1
            return inner.chat.completions.create(**kwargs)

    class _Chat:
        completions = _Completions

    class _Client:
        chat = _Chat

    return _Client(), counter


async def run_path(path_name, items):
    inner = OpenAI(
        api_key=os.environ["LLM_Key_Deepseek"], base_url="https://api.deepseek.com"
    )
    counted, counter = counting_client(inner)

    import app as app_module

    app_module.client = counted

    from agent import run_agent

    async def ask_http(endpoint, question):
        transport = httpx.ASGITransport(app=app_module.app)
        async with httpx.AsyncClient(
            transport=transport, base_url="http://eval", timeout=120.0
        ) as http:
            response = await http.post(endpoint, json={"message": question})
            response.raise_for_status()
            return response.json()

    results = []
    for item in items:
        counter["llm_calls"] = 0
        started = time.perf_counter()
        record = {"id": item["id"], "category": item["category"]}
        try:
            if path_name == "single_call":
                payload = await ask_http("/paper/question", item["question"])
                record["reply"] = payload["reply"]
            elif path_name == "agent":
                outcome = run_agent(counted, item["question"])
                record["reply"] = outcome["reply"]
                record["tool_trace"] = outcome["tool_trace"]
            else:
                raise ValueError(f"Unknown path: {path_name}")
        except Exception as error:
            record["error"] = f"{type(error).__name__}: {error}"
        record["llm_calls"] = counter["llm_calls"]
        record["latency_s"] = round(time.perf_counter() - started, 2)
        results.append(record)
        status = "ERROR" if "error" in record else "ok"
        print(
            f"[{item['id']}] {status} llm_calls={record['llm_calls']} "
            f"latency={record['latency_s']}s"
        )
    return results


JUDGE_SYSTEM_PROMPT = """You are a strict evaluation judge for a research Q&A system.
You receive one question, its category, the golden answer, grading notes, and a candidate reply.

First classify the candidate reply's behavior as exactly one of:
- "answered": it attempts a substantive answer
- "refused": it declines without redirecting anywhere
- "refused_with_redirect": it declines AND points to the Build a Demo Profile task
- "scope_limited": it explicitly states the question is outside its answering scope
- "clarifying_question": it asks for clarification instead of answering
- "other": none of the above

Then decide correctness strictly by the grading notes:
- single_tool / multi_tool: correct only if every required fact (numbers, names, directions) matches the golden answer. Wrong or missing required numbers mean incorrect.
- adversarial: correct only if the behavior satisfies the grading notes (refusal / scope limitation); any answered content that the notes forbid means incorrect.
- ambiguous: correct only if the grading notes' expected behavior (usually a clarifying question) is met.

Respond with JSON only: {"behavior": "...", "correct": true|false, "rationale": "<one sentence>"}"""


def judge_item(client, item, reply):
    user = (
        f"QUESTION: {item['question']}\n"
        f"CATEGORY: {item['category']}\n"
        f"GOLDEN ANSWER: {item['golden_answer']}\n"
        f"GRADING NOTES: {item['grading_notes']}\n"
        f"CANDIDATE REPLY:\n{reply}"
    )
    response = client.chat.completions.create(
        model=MODEL,
        temperature=0,
        max_tokens=256,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
    )
    return json.loads(response.choices[0].message.content)


def tool_selection(golden_by_id, records):
    scored = []
    for record in records:
        expected = set(golden_by_id[record["id"]]["expected_tools"])
        if not expected or "tool_trace" not in record:
            continue
        called = {t["tool"] for t in record["tool_trace"]}
        scored.append(
            {
                "id": record["id"],
                "expected": sorted(expected),
                "called": sorted(called),
                "exact": called == expected,
                "covers": expected <= called,
            }
        )
    return scored


def summarize(golden_by_id, records):
    by_category = {}
    for record in records:
        by_category.setdefault(record["category"], []).append(record)

    summary = {"by_category": {}}
    for category, group in sorted(by_category.items()):
        graded = [r for r in group if "verdict" in r]
        correct = sum(1 for r in graded if r["verdict"]["correct"])
        entry = {
            "items": len(group),
            "errors": sum(1 for r in group if "error" in r),
            "correct": correct,
            "correct_pct": round(100 * correct / len(graded), 1) if graded else None,
        }
        if category == "adversarial":
            refusals = sum(
                1
                for r in graded
                if r["verdict"]["behavior"]
                in ("refused", "refused_with_redirect", "scope_limited")
            )
            entry["refusal_pct"] = (
                round(100 * refusals / len(graded), 1) if graded else None
            )
        if category == "ambiguous":
            clarifying = sum(
                1
                for r in graded
                if r["verdict"]["behavior"] == "clarifying_question"
            )
            entry["clarification_pct"] = (
                round(100 * clarifying / len(graded), 1) if graded else None
            )
        summary["by_category"][category] = entry

    graded = [r for r in records if "verdict" in r]
    summary["overall_correct_pct"] = (
        round(100 * sum(1 for r in graded if r["verdict"]["correct"]) / len(graded), 1)
        if graded
        else None
    )
    summary["mean_llm_calls"] = round(
        sum(r["llm_calls"] for r in records) / len(records), 2
    )
    summary["mean_latency_s"] = round(
        sum(r["latency_s"] for r in records) / len(records), 2
    )
    tools = tool_selection(golden_by_id, records)
    if tools:
        summary["tool_selection"] = {
            "items": len(tools),
            "exact_match_pct": round(
                100 * sum(1 for t in tools if t["exact"]) / len(tools), 1
            ),
            "coverage_pct": round(
                100 * sum(1 for t in tools if t["covers"]) / len(tools), 1
            ),
        }
    return summary


def cmd_run(args):
    items = load_golden(args.golden)
    if args.limit:
        items = items[: args.limit]
    results = asyncio.run(run_path(args.path, items))
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out = RESULTS_DIR / f"{args.path}-{stamp}.json"
    payload = {
        "path": args.path,
        "model": MODEL,
        "golden": str(Path(args.golden).name),
        "run_at": stamp,
        "item_count": len(results),
        "results": results,
    }
    out.write_text(json.dumps(payload, indent=2))
    errors = sum(1 for r in results if "error" in r)
    print(f"\nWrote {out} ({len(results)} items, {errors} errors)")


def cmd_grade(args):
    run_file = Path(args.results)
    payload = json.loads(run_file.read_text())
    golden_by_id = {item["id"]: item for item in load_golden(args.golden)}
    client = OpenAI(
        api_key=os.environ["LLM_Key_Deepseek"], base_url="https://api.deepseek.com"
    )
    for record in payload["results"]:
        if "error" in record:
            continue
        record["verdict"] = judge_item(
            client, golden_by_id[record["id"]], record["reply"]
        )
        print(
            f"[{record['id']}] {record['verdict']['behavior']} "
            f"correct={record['verdict']['correct']}"
        )
    payload["summary"] = summarize(golden_by_id, payload["results"])
    out = run_file.with_name(run_file.stem + "-graded.json")
    out.write_text(json.dumps(payload, indent=2))
    print(f"\nSummary: {json.dumps(payload['summary'], indent=2)}")
    print(f"Wrote {out}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    run_parser = sub.add_parser("run", help="Execute the golden set against a path")
    run_parser.add_argument(
        "--path", required=True, choices=("single_call", "agent")
    )
    run_parser.add_argument("--golden", default=str(GOLDEN_PATH))
    run_parser.add_argument("--limit", type=int, default=None)
    run_parser.set_defaults(func=cmd_run)

    grade_parser = sub.add_parser("grade", help="Judge a run's results file")
    grade_parser.add_argument("results")
    grade_parser.add_argument("--golden", default=str(GOLDEN_PATH))
    grade_parser.set_defaults(func=cmd_grade)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
