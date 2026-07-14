---
status: accepted
---

# Route explicit Research Tasks instead of classifying prompts

The Guided Research Assistant will map each user-selected Research Task directly to its supported interface and backend capability rather than sending all input through LLM intent classification. Paper Question Mode uses a paper-only question contract, Visualization Destinations use direct navigation, and Demo Profiles use structured validation, coverage, confirmation, and matching contracts. ICD keyword selection and Preset Walkthrough play, replay, reset, and other chart interaction belong to their visualization pages rather than the Assistant; the existing Preset Walkthrough card is removed from the Assistant. Legacy general chat and text-extraction endpoints may remain for compatibility but are not used by the new public UI.
