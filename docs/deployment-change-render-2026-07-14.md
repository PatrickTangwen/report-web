# Backend Deployment Change — 2026-07-14

This note records a deployment change without rewriting the earlier Hugging
Face Space handoffs or shipped-contract history.

## Why the host changed

On 2026-07-14, the existing Hugging Face Docker Space accepted and built the
Issue #29 backend revision, but free `cpu-basic` would not schedule the new
container. The Hub CLI also reported that hosting Docker or Gradio Spaces on
free `cpu-basic` now requires a PRO subscription. The old Space container
continued serving its earlier revision, so it could not be used as proof that
Issue #29 was deployed.

## Current deployment seam

- Production API: `https://aligatehr-gen-backend.onrender.com`
- Hosting: Render Free Web Service (Docker)
- Public deployment mirror: `PatrickTangwen/report-web-backend`
- Private matching artifact: Hugging Face Dataset
  `patirckistc/report-web-private`, revision `fibrotic-2026-07-13`

The public mirror contains only the backend deployment source and approved
public release artifacts. It excludes `data/private/`, `.env`, caches, and
credentials. Render receives `HF_TOKEN` and `LLM_Key_Deepseek` as environment
secrets. The Hugging Face token is fine-grained and restricted to read access
for the private Dataset repository.

## Free-tier behavior

Render may spin the service down after inactivity. The first request after a
sleep can therefore take about a minute, but the service remains a zero-cost
research-demo deployment.
