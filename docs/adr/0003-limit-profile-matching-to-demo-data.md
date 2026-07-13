---
status: accepted
---

# Limit profile matching to synthetic or de-identified demo data

The current profile-matching experience will accept only synthetic or sufficiently de-identified Demo Profiles and will be presented as a research demonstration, not diagnosis or treatment support. The UI will warn against entering identifiers or real patient records because chatbot messages are processed through the current third-party LLM service; supporting real patient data would require a separately approved architecture for consent, access control, model deployment, auditing, retention, and clinical governance.
