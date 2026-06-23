import os
from contextlib import asynccontextmanager

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

SYSTEM_PROMPT = (
    "You are a research assistant for the ALIGATEHR-Gen project — a graph attention "
    "network that integrates EHR data, genetic data, and external medical ontology to "
    "improve disease risk prediction. You help visitors understand the paper's methodology, "
    "results, and clinical implications.\n\n"
    "Keep answers concise and scientifically accurate. If you are unsure about something "
    "specific to the paper, say so rather than guessing.\n\n"
    "Important: This is a research prototype for demonstration purposes only. Any clinical "
    "information discussed should not be used for medical decision-making."
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class ChatResponse(BaseModel):
    reply: str


client: anthropic.Anthropic | None = None


@asynccontextmanager
async def lifespan(app):
    global client
    api_key = os.environ.get("LLM_API_KEY")
    if api_key:
        client = anthropic.Anthropic(api_key=api_key)
    yield


app = FastAPI(title="ALIGATEHR-Gen Chatbot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://patricktangwen.github.io",
        "https://patirckistc-report-web.hf.space",
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply = response.content[0].text
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")

    return ChatResponse(reply=reply)
