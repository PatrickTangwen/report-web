import os
import re
from contextlib import asynccontextmanager

from openai import OpenAI, APIError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from paper_context import PAPER_TEXT
from data_query import query_data, format_data_context

INTENT_SYSTEM_PROMPT = (
    "You are an intent classifier. Given a user message, classify it into exactly one "
    "of these categories:\n"
    "- paper_qa: questions about the ALIGATEHR-Gen paper, methodology, results, "
    "architecture, dataset, evaluation, ablation study, or related academic content\n"
    "- clinical: requests for clinical risk assessment, patient-specific predictions, "
    "disease risk evaluation, or guided clinical support\n"
    "- data_query: requests to look up, filter, or analyze specific data from the "
    "datasets (e.g. CSV files, specific patient counts, specific metric values)\n"
    "- general: greetings, off-topic, or anything that does not fit the above\n\n"
    "Respond with ONLY the category name, nothing else."
)

PAPER_QA_SYSTEM_PROMPT = (
    "You are a research assistant for the ALIGATEHR-Gen project. "
    "Answer questions using ONLY the paper content provided below. "
    "If the answer is not in the paper, say so explicitly — do not guess or hallucinate.\n\n"
    "Keep answers concise, scientifically accurate, and well-structured. "
    "Use specific numbers and facts from the paper when relevant.\n\n"
    "Important: This is a research prototype for demonstration purposes only. "
    "Any clinical information discussed should not be used for medical decision-making.\n\n"
    "--- PAPER CONTENT ---\n"
    f"{PAPER_TEXT}\n"
    "--- END PAPER CONTENT ---"
)

CLINICAL_NOT_READY = (
    "The clinical risk assessment feature is not yet available. "
    "It is currently under development and will support guided disease risk evaluation "
    "in a future update. In the meantime, I can answer questions about the ALIGATEHR-Gen "
    "paper and methodology — feel free to ask!"
)

DATA_QUERY_SYSTEM_PROMPT = (
    "You are a data analyst for the ALIGATEHR-Gen project. "
    "Answer questions using ONLY the query results provided below. "
    "If the data does not contain the answer, say so explicitly.\n\n"
    "Present numbers precisely as they appear in the data. "
    "Use tables or bullet points for comparative answers. "
    "Keep answers concise and well-structured.\n\n"
    "Important: This is a research prototype for demonstration purposes only.\n\n"
)

INTENT_LABELS = ("paper_qa", "clinical", "data_query", "general")


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class ChatResponse(BaseModel):
    reply: str
    intent: str = "paper_qa"


client: OpenAI | None = None


@asynccontextmanager
async def lifespan(app):
    global client
    api_key = os.environ.get("LLM_Key_Deepseek")
    if api_key:
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
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
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")

    try:
        intent = classify_intent(req.message)
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")

    if intent == "clinical":
        return ChatResponse(reply=CLINICAL_NOT_READY, intent=intent)

    if intent == "data_query":
        results, disease, dataset_names = query_data(req.message)
        data_context = format_data_context(results, disease, dataset_names)
        system = DATA_QUERY_SYSTEM_PROMPT + "--- QUERY RESULTS ---\n" + data_context + "\n--- END QUERY RESULTS ---"
    else:
        system = PAPER_QA_SYSTEM_PROMPT

    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in req.history)
    messages.append({"role": "user", "content": req.message})

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            max_tokens=1024,
            messages=messages,
        )
        reply = response.choices[0].message.content
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")

    return ChatResponse(reply=reply, intent=intent)
