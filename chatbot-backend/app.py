import os
import re
from contextlib import asynccontextmanager

from openai import OpenAI, APIError
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from paper_context import PAPER_TEXT
from data_query import query_data, format_data_context, match_disease, is_pathway_query, is_embedding_query
from clinical_form import get_available_diseases, get_form_fields
from risk_assessment import query_patient_risk
from followup import get_pathway_enrichment, describe_embedding_context
from fibrotic_release import load_fibrotic_release

INTENT_SYSTEM_PROMPT = (
    "You are an intent classifier. Given a user message, classify it into exactly one "
    "of these categories:\n\n"
    "- data_query: asking for specific metric values, scores, rankings, comparisons "
    "between models, ablation results, feature importance, risk factors, pathway "
    "enrichment, or any quantitative lookup. Examples: "
    '"What\'s the AUROC for CKD?", "Which model performs best on diabetes?", '
    '"What happens without genetic data?", "Top risk factors for MASH?", '
    '"What pathways are enriched in CKD?"\n'
    "- clinical: requests for personal clinical risk assessment, patient-specific "
    "predictions, or guided clinical support for the user themselves\n"
    "- paper_qa: questions about how the model works, the methodology, architecture, "
    "training process, graph construction, attention mechanism, or general discussion "
    "of the paper's contributions and limitations\n"
    "- general: greetings, off-topic, or anything that does not fit the above\n\n"
    "If the user asks for a specific number, score, comparison, or ranking, "
    "classify as data_query.\n\n"
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

CLINICAL_PROMPT = (
    "I can help assess your risk for the following diseases. "
    "Please select one to begin the clinical risk assessment:"
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


def _format_embedding_context(emb):
    groups = emb["groups"]
    lines = [
        f"Disease: {emb['disease_label']} ({emb['embed_disease']})",
        f"Total patients in embedding space: {emb['total_patients']}",
        f"UMAP centroid: ({emb['centroid']['x']}, {emb['centroid']['y']})",
        f"Mean 2D purity: {emb['mean_purity_2d']}",
        "",
        "Patient group distribution:",
        f"  Pure: {groups['pure']['count']} ({groups['pure']['pct']}%)",
        f"  Intermediate: {groups['intermediate']['count']} ({groups['intermediate']['pct']}%)",
        f"  Overlap: {groups['overlap']['count']} ({groups['overlap']['pct']}%)",
        "",
        "Nearest disease clusters (by UMAP centroid distance):",
    ]
    for n in emb["nearest_clusters"]:
        lines.append(f"  {n['disease']}: distance {n['distance']}")
    return "\n".join(lines)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    assessed_disease: str | None = None


class ChatResponse(BaseModel):
    reply: str
    intent: str = "paper_qa"
    ui: dict | None = None


class FormFieldsResponse(BaseModel):
    disease: str
    disease_label: str
    fields: list[dict]


class ClinicalSubmitRequest(BaseModel):
    disease: str
    values: dict


class ClinicalSubmitResponse(BaseModel):
    status: str
    disease: str
    message: str


class AssessRequest(BaseModel):
    disease: str
    values: dict


class AssessResponse(BaseModel):
    disease: str
    disease_label: str
    risk_level: str
    risk_probability: float
    risk_factors: list[dict]
    similar_patients: dict
    disclaimer: str


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


@app.get("/form-fields", response_model=FormFieldsResponse)
async def form_fields(disease: str = Query(min_length=1)):
    result = get_form_fields(disease)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown disease: {disease}")
    return result


@app.post("/clinical/submit", response_model=ClinicalSubmitResponse)
async def clinical_submit(req: ClinicalSubmitRequest):
    result = get_form_fields(req.disease)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown disease: {req.disease}")
    return ClinicalSubmitResponse(
        status="received",
        disease=result["disease"],
        message=(
            f"Your clinical data for {result['disease_label']} has been received. "
            "Risk assessment report generation will be available in a future update."
        ),
    )


@app.post("/assess", response_model=AssessResponse)
async def assess(req: AssessRequest):
    result = query_patient_risk(req.values, req.disease)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown disease: {req.disease}")
    return result


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if client is None:
        raise HTTPException(status_code=503, detail="LLM API key not configured")

    try:
        intent = classify_intent(req.message)
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")

    if intent == "clinical":
        diseases = get_available_diseases()
        return ChatResponse(
            reply=CLINICAL_PROMPT,
            intent=intent,
            ui={"type": "disease_select", "diseases": diseases},
        )

    if intent == "data_query":
        disease_from_msg = match_disease(req.message)
        disease = disease_from_msg or req.assessed_disease

        if is_pathway_query(req.message) and disease:
            pw = get_pathway_enrichment(disease)
            if pw:
                return ChatResponse(
                    reply=f"Here are the top enriched pathways for **{pw['disease_label']}**:",
                    intent="data_query",
                    ui={"type": "pathway_enrichment", **pw},
                )

        if is_embedding_query(req.message) and disease:
            emb = describe_embedding_context(disease)
            if emb:
                emb_context = _format_embedding_context(emb)
                system = DATA_QUERY_SYSTEM_PROMPT + "--- EMBEDDING CONTEXT ---\n" + emb_context + "\n--- END EMBEDDING CONTEXT ---"
                messages = [{"role": "system", "content": system}]
                messages.extend({"role": m.role, "content": m.content} for m in req.history)
                messages.append({"role": "user", "content": req.message})
                try:
                    response = client.chat.completions.create(
                        model="deepseek-chat", max_tokens=1024, messages=messages,
                    )
                    reply = response.choices[0].message.content
                except APIError as e:
                    raise HTTPException(status_code=502, detail=f"LLM API error: {e.message}")
                return ChatResponse(reply=reply, intent="data_query")

        results, disease_q, dataset_names = query_data(req.message)
        if not disease_q and req.assessed_disease:
            results, _, dataset_names = query_data(req.message + " " + req.assessed_disease)
            disease_q = req.assessed_disease
        data_context = format_data_context(results, disease_q, dataset_names)
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
