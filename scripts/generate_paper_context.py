#!/usr/bin/env python3
"""Generate the backend's published-paper context from the published report page."""

import argparse
import hashlib
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "report" / "old-report.qmd"
TARGET = ROOT / "chatbot-backend" / "paper_context.py"


def _front_matter(text):
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError("Published report has unterminated front matter")
    yaml = text[4:end].splitlines()
    body = text[end + 5 :]
    values = {}
    index = 0
    while index < len(yaml):
        line = yaml[index]
        if ":" not in line:
            index += 1
            continue
        key, raw = line.split(":", 1)
        if raw.strip() == "|":
            index += 1
            block = []
            while index < len(yaml) and yaml[index].startswith("  "):
                block.append(yaml[index].strip())
                index += 1
            values[key] = " ".join(block)
            continue
        values[key] = raw.strip().strip('"')
        index += 1
    return values, body


def _plain_markdown(text):
    lines = []
    in_math = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.strip().startswith("$$") and line.strip().endswith("$$") and len(line.strip()) > 4:
            continue
        if line.strip() == "$$":
            in_math = not in_math
            continue
        if in_math or line.lstrip().startswith("![") or line.strip() == ":::" or line.strip().startswith("::: {"):
            continue
        heading = re.match(r"^#{2,6}\s+(.+)$", line)
        if heading:
            title = re.sub(r"\s*\{[^}]+\}\s*$", "", heading.group(1))
            lines.extend(["", f"{title}:"])
            continue
        line = re.sub(r"\s*\[@[^\]]+\]", "", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        line = re.sub(r"\{#[^}]+\}", "", line)
        line = line.replace("**", "")
        line = re.sub(r"\^([ab])\^", r"\1", line)
        line = re.sub(r"@fig-[A-Za-z0-9_-]+", "the figure", line)
        line = re.sub(r"@tbl-[A-Za-z0-9_-]+", "the table", line)
        lines.append(line)
    normalized = "\n".join(lines).strip()
    return re.sub(r"\n{3,}", "\n\n", normalized)


def render_module():
    source_text = SOURCE.read_text(encoding="utf-8")
    metadata, body = _front_matter(source_text)
    title = metadata.get("title", "ALIGATEHR-Gen")
    abstract = metadata.get("abstract", "")
    paper_text = f"Title: {title}\n\nAbstract:\n{abstract}\n\n{_plain_markdown(body)}"
    source_sha = hashlib.sha256(source_text.encode()).hexdigest()
    return (
        '"""Generated from report/old-report.qmd; run scripts/generate_paper_context.py."""\n\n'
        f'PAPER_SOURCE = "report/old-report.qmd"\n'
        f'PAPER_SOURCE_SHA256 = "{source_sha}"\n'
        f"PAPER_TEXT = {paper_text!r}\n"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    rendered = render_module()
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != rendered:
            print("Published paper context is out of date.", file=sys.stderr)
            return 1
        print("Published paper context is synchronized.")
        return 0
    TARGET.write_text(rendered, encoding="utf-8")
    print(f"Generated {TARGET.relative_to(ROOT)} from {SOURCE.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
