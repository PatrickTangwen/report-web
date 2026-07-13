# ALIGATEHR-Gen Research Experience

This context defines the language used when the website relates a visitor's clinical profile to the research cohort and its embedding visualizations.

## Language

**Query Patient**:
The visitor-described patient profile submitted for research-oriented comparison. In the current experience it must be a Demo Profile and is not assumed to be a UK Biobank participant or an existing point in an embedding.
_Avoid_: User point, UKB patient

**Demo Profile**:
A synthetic or sufficiently de-identified Query Patient profile supplied only to demonstrate the research comparison workflow. It is not a real patient record and must not contain identifying information.
_Avoid_: Real patient, clinical record, protected health information

**Profile Draft**:
A structured interpretation of a Query Patient's free-text description that has not yet been verified by the visitor. It is not eligible for cohort matching.
_Avoid_: Patient record, confirmed input

**Feature Candidate**:
A raw field, value, unit, and source-text proposal extracted by the LLM. It enters a Profile Draft only after deterministic mapping and validation.
_Avoid_: Confirmed value, valid feature, model confidence

**Profile Session**:
The temporary, browser-scoped interaction in which Reported Features are accumulated, corrected, and confirmed across chatbot messages for one Demo Profile.
_Avoid_: Patient account, saved record, longitudinal history

**Confirmed Profile**:
A Profile Draft whose mapped features, values, and units have been reviewed and explicitly confirmed by the visitor. Only a Confirmed Profile is eligible for cohort matching.
_Avoid_: LLM output, extracted profile

**Comparison Target**:
One of the supported fibrotic disease categories that the visitor explicitly confirms as the scope for reference-cohort comparison. It is not a diagnosis or a disease classification produced by the system.
_Avoid_: Predicted disease, inferred diagnosis

**Matchable Feature Schema**:
The fixed, reviewed set of Query Patient attributes that have compatible fields in the Fibrotic Reference Cohort and may contribute to profile matching. Recognized attributes outside this schema do not affect matching.
_Avoid_: Top features, arbitrary UKB fields, all extracted values

**Reported Feature**:
A value the visitor directly supplies or confirms, such as height, weight, blood pressure, or smoking status. Its original value and unit remain visible during confirmation.
_Avoid_: Model input, inferred value

**Derived Match Feature**:
A value calculated deterministically from confirmed Reported Features for cohort comparison, such as BMI from height and weight. It is shown to the visitor and is never guessed by the LLM.
_Avoid_: LLM estimate, hidden feature

**Profile Coverage**:
The amount of independently useful matching information present in a Confirmed Profile, evaluated across feature domains. It determines whether comparison is eligible and must not be presented as prediction confidence.
_Avoid_: Confidence score, match accuracy

**Outside Reference Support**:
A valid, confirmed feature value that falls beyond the range represented by the comparison cohort. It is preserved as entered and may prevent a stable neighborhood; it is not treated as an invalid value.
_Avoid_: Invalid input, corrected value, outlier removal

**Profile Similarity**:
The domain-balanced comparison between a Confirmed Profile and Reference Patients within its Comparison Target. It is calculated from matchable features and is independent of proximity in the two-dimensional embedding visualization.
_Avoid_: Embedding distance, predicted similarity

**Cohort Comparison Result**:
The research-demo output describing Profile Coverage, a Matched Reference Neighborhood or No Stable Neighborhood, and privacy-safe aggregate context. It is not an individual disease-risk prediction.
_Avoid_: Risk assessment, risk report, diagnosis

**ICD Keyword Match**:
A validated ICD code, code range, or category associated with a basic disease keyword in the visitor's input. It provides navigation and highlighting context for the ICD embedding and is not part of patient similarity matching.
_Avoid_: ICD history, patient diagnosis record, matching feature

**ICD Keyword Vocabulary**:
The versioned, researcher-reviewed set of supported disease keywords, synonyms, and deterministic ICD selectors used to produce ICD Keyword Matches.
_Avoid_: Complete ICD ontology, LLM-generated codebook

**Visualization Request**:
A visitor-triggered request from a chatbot result to focus a specific embedding visualization on a Matched Reference Neighborhood or ICD Keyword Match. It is never triggered by an unconfirmed Profile Draft.
_Avoid_: Automatic redirect, chatbot chart

**Reference Patient**:
An anonymized patient record already present in the research cohort and its precomputed embedding.
_Avoid_: User, matched user

**Visual Reference ID**:
An opaque, release-scoped identifier that connects a Reference Patient's private matching record to its public visualization point within one Dataset Release. It carries no clinical meaning and is not a participant identifier.
_Avoid_: Patient ID, UKB ID, row number

**Dataset Release**:
A versioned pair of private matching and display-safe visualization artifacts generated together from the same approved source snapshot and served by the backend data authority.
_Avoid_: CSV version, backend version, frontend version

**Fibrotic Reference Cohort**:
The Reference Patients associated with the seven canonical comparison categories: Chronic Kidney Disease, Cardiac Fibrosis, MASH, Pulmonary Fibrosis, Systemic Sclerosis / Connective Tissue, Crohn's Disease, and Skin Fibrosis. It is the only cohort currently approved for Matched Reference Neighborhood results.
_Avoid_: Full UKB cohort, all-patient cohort

**Matched Reference Neighborhood**:
The threshold-qualified set of Reference Patients whose available clinical features are most similar to a Query Patient. It represents comparable cohort examples, not the Query Patient's own learned embedding, and may be empty.
_Avoid_: Query Patient embedding, predicted patient point, user cluster

**No Stable Neighborhood**:
The outcome when an eligible Confirmed Profile has no sufficiently similar Reference Patients under the validated matching threshold. It does not mean that no clinically similar people exist outside the reference cohort.
_Avoid_: No patients like you, negative result, low confidence

**Neighborhood Summary**:
An aggregate, privacy-reviewed description of a Matched Reference Neighborhood or Display Region. It never exposes a single Reference Patient's identifier or complete clinical feature combination.
_Avoid_: Patient example, representative patient, case profile

**Neighborhood Marker**:
A visual summary position for a Matched Reference Neighborhood. It must not be presented as the Query Patient's own embedding point.
_Avoid_: Patient point, predicted embedding

**Display Region**:
A spatial grouping of matched visualization points used only to organize zooming and annotations in the two-dimensional plot. Multiple Display Regions may represent one Matched Reference Neighborhood and do not constitute clinical clusters.
_Avoid_: Disease cluster, patient subtype, match group
