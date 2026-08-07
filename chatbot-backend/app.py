import json
import os
import re
from contextlib import asynccontextmanager
from typing import Literal

from openai import OpenAI, APIError
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent import run_agent, stream_agent
from mcp_server import research_mcp
from fibrotic_release import load_fibrotic_release
from demo_profile import (
    FEATURE_EXTRACTION_SYSTEM_PROMPT,
    ProfileRateLimiter,
    build_profile_draft,
    confirm_profile,
    parse_feature_candidates,
)
from profile_matching import (
    evaluate_profile_coverage,
    load_matching_release,
    match_confirmed_profile,
)
from fibrotic_contract import TARGETS
from synthetic_example_profiles import get_synthetic_example_profile

class Message(BaseModel):
    role: str
    content: str


class PaperQuestionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Message] = []


class ToolTraceEntry(BaseModel):
    tool: str
    arguments: str
    ok: bool


class PaperQuestionResponse(BaseModel):
    reply: str
    tool_trace: list[ToolTraceEntry] = []


class FeatureCandidate(BaseModel):
    field: str = Field(min_length=1, max_length=80)
    raw_value: str | float | int | bool | None
    raw_unit: str | None = Field(default=None, max_length=40)
    source_text: str = Field(min_length=1, max_length=500)
    operation: Literal["set", "correct", "remove"] = "set"


class ProfileExtractRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ProfileExtractResponse(BaseModel):
    candidates: list[FeatureCandidate]


class ProfileValidateRequest(BaseModel):
    candidates: list[FeatureCandidate] = Field(max_length=100)


# The seven approved Comparison Targets, as a Pydantic-checkable literal. A
# test asserts this stays equal to fibrotic_contract.TARGETS.
ComparisonTarget = Literal[
    "CKD",
    "Cardiac_Fibrosis",
    "MASH",
    "Pulmonary_fibrosis",
    "SSc_Connective_Tissue",
    "Crohns_Disease",
    "Fibrosis_of_Skin",
]


class ProfileCoverageRequest(BaseModel):
    candidates: list[FeatureCandidate] = Field(max_length=100)
    target: ComparisonTarget


class ProfileDraftInput(BaseModel):
    state: str
    candidates: list[FeatureCandidate] = Field(max_length=100)


class ProfileConfirmRequest(BaseModel):
    draft: ProfileDraftInput


class ProfileMatchRequest(BaseModel):
    confirmed_profile: ProfileDraftInput
    target: ComparisonTarget


class SyntheticExampleProfileResponse(BaseModel):
    target: str
    version: str
    review_status: str
    candidates: list[FeatureCandidate]


client: OpenAI | None = None
profile_rate_limiter = ProfileRateLimiter()


def get_profile_matching_release():
    try:
        return load_matching_release()
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=f"Profile matching release unavailable: {error}",
        )


def enforce_profile_rate_limit(request):
    client_key = request.client.host if request.client else "unknown"
    if not profile_rate_limiter.allow(client_key):
        raise HTTPException(status_code=429, detail="Too many profile requests")


@asynccontextmanager
async def lifespan(app):
    global client
    api_key = os.environ.get("LLM_Key_Deepseek")
    if api_key:
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    # A mounted MCP sub-app's own lifespan never runs, so its session
    # manager must be driven by the host app's lifespan (ADR-0015).
    async with research_mcp.session_manager.run():
        yield


app = FastAPI(title="ALIGATEHR-Gen Chatbot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://patricktangwen.github.io",
        "https://patirckistc-report-web.hf.space",
    ],
    allow_origin_regex=r"^http://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def classify_intent(user_message):
    response = client.chat.completions.create(
        model="deepseek-chat",
        max_tokens=16,
        temperature=0,
        messages=[
            {"role": "system", "content": INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    raw = response.choices[0].message.content.strip().lower()
    raw = re.sub(r"[^a-z_]", "", raw)
    if raw in INTENT_LABELS:
        return raw
    return "paper_qa"


@app.get("/health")
async def health():
    get_profile_matching_release()
    return {"status": "ok"}


def _release_headers(dataset_version):
    return {
        "Cache-Control": "public, max-age=300",
        "ETag": f'"{dataset_version}"',
    }


@app.get("/embedding/fibrotic")
async def fibrotic_embedding(request: Request, response: Response):
    embedding, _ = load_fibrotic_release()
    headers = _release_headers(embedding["dataset_version"])
    if request.headers.get("if-none-match") == headers["ETag"]:
        return Response(status_code=304, headers=headers)
    response.headers.update(headers)
    return embedding


@app.get("/embedding/fibrotic/preset")
async def fibrotic_preset(response: Response):
    embedding, preset = load_fibrotic_release()
    response.headers.update(_release_headers(embedding["dataset_version"]))
    return preset


@app.post("/profile/extract", response_model=ProfileExtractResponse)
async def profile_extract(req: ProfileExtractRequest, request: Request):
    enforce_profile_rate_limit(request)
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            max_tokens=900,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": FEATURE_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": req.message},
            ],
        )
        candidates = parse_feature_candidates(
            req.message, response.choices[0].message.content
        )
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"LLM API error: {error.message}")
    except (AttributeError, ValueError) as error:
        raise HTTPException(status_code=502, detail=str(error))
    return {"candidates": candidates}


@app.post("/profile/validate")
async def profile_validate(req: ProfileValidateRequest, request: Request):
    enforce_profile_rate_limit(request)
    return build_profile_draft([candidate.model_dump() for candidate in req.candidates])


@app.post("/profile/coverage")
async def profile_coverage(
    req: ProfileCoverageRequest,
    request: Request,
    release=Depends(get_profile_matching_release),
):
    enforce_profile_rate_limit(request)
    draft = build_profile_draft([candidate.model_dump() for candidate in req.candidates])
    coverage, _ = evaluate_profile_coverage(draft, req.target, release["calibration"])
    return {"target": req.target, "profile_coverage": coverage}


@app.post("/profile/confirm")
async def profile_confirm(req: ProfileConfirmRequest, request: Request):
    enforce_profile_rate_limit(request)
    try:
        return confirm_profile(req.draft.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))


@app.post("/profile/match")
async def profile_match(
    req: ProfileMatchRequest,
    request: Request,
    release=Depends(get_profile_matching_release),
):
    enforce_profile_rate_limit(request)
    if req.confirmed_profile.state != "confirmed":
        raise HTTPException(status_code=409, detail="Profile must be explicitly confirmed")
    try:
        confirmed = confirm_profile(req.confirmed_profile.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
    return match_confirmed_profile(
        confirmed,
        req.target,
        release["rows"],
        release["calibration"],
        release["dataset_version"],
    )


@app.get("/profile/synthetic-example/{target}", response_model=SyntheticExampleProfileResponse)
async def synthetic_example_profile(target: str):
    if target not in TARGETS:
        raise HTTPException(status_code=404, detail="Unknown Comparison Target")
    try:
        return get_synthetic_example_profile(target)
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=f"Synthetic Example Profile unavailable: {error}",
        )


@app.post("/paper/question", response_model=PaperQuestionResponse)
async def paper_question(req: PaperQuestionRequest):
    """Paper Question Mode: bounded in-task agent over Study Evidence.

    Task selection stays explicit (ADR-0010); within this task the agent
    orchestrates the Study Evidence tools (ADR-0013, ADR-0014). Unlike
    /chat, no intent classification or keyword routing runs here. The
    response contract is unchanged; tool_trace is additive metadata the
    widget ignores.
    """
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")

    history = [{"role": m.role, "content": m.content} for m in req.history]
    try:
        outcome = run_agent(client, req.message, history=history)
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return PaperQuestionResponse(
        reply=outcome["reply"], tool_trace=outcome["tool_trace"]
    )


def _sse_line(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.post("/paper/question/stream")
async def paper_question_stream(req: PaperQuestionRequest):
    """SSE variant of /paper/question: tool-activity events plus streamed
    answer tokens (event types: tool_call, tool_result, token, done, error).

    The widget degrades to the non-streaming endpoint only on connection
    failure; a mid-stream error event is terminal, never silently refetched.
    """
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")

    history = [{"role": m.role, "content": m.content} for m in req.history]

    def events():
        try:
            for item in stream_agent(client, req.message, history=history):
                yield _sse_line(item["event"], item["data"])
        except (APIError, RuntimeError) as error:
            yield _sse_line("error", {"detail": str(error)})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )



# MCP research-data service: Streamable HTTP transport mounted at /mcp.
# Placed after all API routes; the mount only claims the /mcp subtree.
app.mount("/mcp", research_mcp.streamable_http_app())
