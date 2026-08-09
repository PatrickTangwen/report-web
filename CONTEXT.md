# ALIGATEHR-Gen Research Experience

> **Current data-status amendment (2026-08-08):** references below to
> "published study result data" describe the intended evidence class, but the
> current evaluation, ablation, and pathway release is
> `research-results-mock-v1`. The assistant and UI must label those values as
> mock demonstration evidence until a reviewed manifest changes the release
> status to `published`.

This context defines the language used when the website relates a visitor's clinical profile to the research cohort and its embedding visualizations.

## Language

**Guided Research Assistant**:
The task-oriented research experience that helps a visitor choose and complete a supported research activity without requiring them to invent prompts. Free-form input exists only for Research Questions within Paper Question Mode.
_Avoid_: Generic chatbot, prompt box

**Assistant Shell**:
The shared floating website surface that hosts the Research Task Menu, Paper Question Mode, and Demo Profile Wizard. It changes layout for the selected Research Task without navigating to a separate Assistant page.
_Avoid_: Chat box, separate application

**Research Task**:
A visitor-selected goal within the Guided Research Assistant, such as exploring findings, viewing a visualization walkthrough, or building a Demo Profile.
_Avoid_: Prompt, chat intent

**Research Task Contract**:
The explicit mapping from a visitor-selected Research Task to its supported interaction and backend capability. The selected task, rather than LLM intent classification, determines which operation may run.
_Avoid_: Inferred intent, prompt routing

**Research Task Menu**:
The entry point that organizes all supported activities into Understand the Research, Explore Visualizations, and Build a Demo Profile.
_Avoid_: Empty chat, prompt starter

**Paper Question Mode**:
The Understand the Research task in which the visitor writes a free-form Research Question and the assistant answers only from Study Evidence. A question outside Study Evidence must receive an explicit scope limitation rather than a guessed answer.
_Avoid_: General chat, open-domain assistant

**Study Evidence**:
The reviewed set of published grounding sources a Paper Question answer may draw from: the published project paper and the published study result data (evaluation metrics, ablation results, pathway enrichment, and cohort-level fibrotic summaries). It excludes external knowledge, unpublished manuscripts, and patient-level records.
_Avoid_: RAG, retrieval, open-domain knowledge

**Paper Question Session**:
The temporary, tab-scoped conversation within Paper Question Mode. It remains available while the visitor switches Research Tasks and ends when explicitly cleared or when the tab is closed.
_Avoid_: Saved conversation, cross-device history

**Research Question**:
A visitor-authored question about the project paper within Paper Question Mode.
_Avoid_: Command, task selection

**Query Patient**:
The visitor-described patient profile submitted for research-oriented comparison. In the current experience it must be a Demo Profile and is not assumed to be a UK Biobank participant or an existing point in an embedding.
_Avoid_: User point, UKB patient

**Demo Profile**:
A synthetic or sufficiently de-identified Query Patient profile supplied only to demonstrate the research comparison workflow. It is not a real patient record and must not contain identifying information.
_Avoid_: Real patient, clinical record, protected health information

**Synthetic Example Profile**:
A fixed, reviewed Demo Profile associated with exactly one Comparison Target that a visitor may load into the Demo Profile Wizard without supplying personal information. Each target has its own versioned example; examples are editable, are not copied from Reference Patients, and never confirm or start comparison automatically.
_Avoid_: Example patient, representative case, preset result

**Demo Profile Wizard**:
The staged form experience inside the Assistant Shell that selects a Comparison Target, collects optional Reported Features, provides Coverage Guidance, and reviews the Profile Draft before comparison. It is not presented as a chat transcript.
_Avoid_: Profile prompt, clinical intake chat

**Research Use Notice**:
The layered explanation that the experience is a research prototype and that Demo Profiles must be synthetic or sufficiently de-identified. A concise global notice remains visible, while the actionable privacy boundary appears when a visitor enters or confirms a Demo Profile.
_Avoid_: Repeated disclaimer message, consent checkbox

**Profile Draft**:
A structured set of proposed Query Patient fields assembled through the guided Demo Profile form or the optional backend text extractor and not yet verified by the visitor. It is not eligible for cohort matching.
_Avoid_: Patient record, confirmed input

**Feature Candidate**:
A raw field, value, unit, and source proposal created by a reviewed form control or the optional backend text extractor. It enters a Profile Draft only after deterministic mapping and validation.
_Avoid_: Confirmed value, valid feature, model confidence

**Profile Session**:
The temporary, tab-scoped guided interaction in which a Comparison Target is selected and Reported Features are accumulated, corrected, and confirmed for one Demo Profile. It remains available while the visitor switches Research Tasks and ends when explicitly cleared or when the tab is closed.
_Avoid_: Patient account, saved record, longitudinal history

**Confirmed Profile**:
A Profile Draft whose Comparison Target, mapped features, values, units, and Profile Coverage have been reviewed and explicitly confirmed by the visitor through the Confirm and compare with reference cohort action. No separate affirmation checkbox is required.
_Avoid_: LLM output, extracted profile

**Comparison Target**:
Exactly one supported fibrotic disease category that the visitor must explicitly select at the start of a Profile Session as the scope for reference-cohort comparison. The system never infers, recommends, or substitutes a target, and the selection is not a diagnosis or disease classification.
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
The amount of independently useful matching information present in a Confirmed Profile, evaluated across feature domains. No individual field is universally required, but comparison is eligible only when the profile satisfies a reviewed target-specific coverage pattern; coverage must not be presented as prediction confidence.
_Avoid_: Confidence score, match accuracy

**Coverage Guidance**:
A target-specific explanation of which feature domains are represented and which optional fields could improve Profile Coverage before comparison. It is not a requirement list, quality score, or prediction confidence.
_Avoid_: Required medical data, completeness score, confidence meter

**Outside Reference Support**:
A valid, confirmed feature value that falls beyond the range represented by the comparison cohort. It is preserved as entered and may prevent a stable neighborhood; it is not treated as an invalid value.
_Avoid_: Invalid input, corrected value, outlier removal

**Profile Similarity**:
The domain-balanced comparison between a Confirmed Profile and Reference Patients within its Comparison Target. It is calculated from matchable features and is independent of proximity in the two-dimensional embedding visualization.
_Avoid_: Embedding distance, predicted similarity

**Cohort Comparison Result**:
The research-demo output after a confirmed comparison, describing Profile Coverage and either a Matched Reference Neighborhood or No Stable Neighborhood. A matched result is handed to the destination visualization; a no-stable-neighborhood result remains in the Demo Profile Wizard. It is not an individual disease-risk prediction.
_Avoid_: Risk assessment, risk report, diagnosis

**Matched Reference Summary**:
The compact, glanceable context shown with a matched-reference visualization: Comparison Target, matched-reference count, and privacy-permitted median age and sex distribution. It does not include a risk score, confidence, similarity percentage, full Profile Coverage, or detailed aggregate report.
_Avoid_: Results panel, risk summary, match score

**ICD Keyword Match**:
A validated ICD code, code range, or category selected or searched within the ICD visualization page. It provides navigation and highlighting context for the ICD embedding and is not part of patient similarity matching or the Guided Research Assistant.
_Avoid_: ICD history, patient diagnosis record, matching feature

**ICD Keyword Vocabulary**:
The versioned, researcher-reviewed set of supported disease keywords, synonyms, and deterministic ICD selectors used to produce ICD Keyword Matches.
_Avoid_: Complete ICD ontology, LLM-generated codebook

**Visualization Request**:
A handoff from the Guided Research Assistant to a full-page visualization. Selecting a Visualization Destination triggers it directly; a confirmed Demo Profile triggers it automatically only when comparison returns a Matched Reference Neighborhood; an Answer Evidence entry may offer a Chart Preset link the visitor follows explicitly. A request is never triggered by an unconfirmed Profile Draft or No Stable Neighborhood, and the Assistant never navigates automatically from an answer.
_Avoid_: Assistant result card, chatbot chart

**Answer Evidence**:
The structured, size-capped summary of the tool results a Paper Question answer is grounded in: tool name, resolved filters, and a bounded excerpt of the returned data (section names only for paper content). It is recorded per tool call and rendered as provenance with the answer, and it is the only source for any chart or action derived from an answer — never the answer's prose.
_Avoid_: citation list, model attribution, parsed answer text

**Chart Preset**:
A shareable URL fragment state, such as a disease and metric selection, that a visualization page reads at load to preset its own controls. It configures view state only and carries no data; matched-comparison handoffs keep their dedicated request mechanism.
_Avoid_: saved view, data payload, cross-tab session

**Visualization Destination**:
One of the full-page Performance, Ablation, or Use Case research experiences that a visitor can open from the Guided Research Assistant.
_Avoid_: Individual chart command, Assistant control panel

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
