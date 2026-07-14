---
status: accepted
---

# Do not infer Query Patient risk from reference-neighborhood outcomes

The profile-matching workflow will return a Cohort Comparison Result and will not calculate personal risk probability or low, medium, or high risk by averaging `p_true` values from matched Reference Patients. Such an average is neither ALIGATEHR-Gen inference for the Query Patient nor a calibrated individual prediction; personal risk may be added only through a separately validated model-inference path with appropriate clinical governance.
