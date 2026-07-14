# Guided Research Assistant UI/UX Redesign

## Problem Statement

The current ALIGATEHR-Gen chatbot exposes several unrelated capabilities through one conversational surface. Visitors are expected to discover which prompts trigger paper questions, visualization actions, Demo Profile extraction, ICD highlighting, data queries, and cohort comparison. The initial copy and long disclaimers do not explain these hidden contracts, and valid-looking messages can reach the wrong intent or produce technical backend errors. The result is an interface in which visitors do not know what they can do, what they should type, or when they should stop typing and use a structured control.

The experience also forces non-conversational workflows into chat bubbles. Demo Profile creation is a structured, multi-step activity with units, validation, coverage, confirmation, and target selection, yet it currently begins with free text. Visualization controls are split between the Assistant and the destination pages even though the pages have the space and context needed to own those interactions. On mobile, the narrow chat layout makes these problems more severe.

## Solution

Replace the generic chatbot entry experience with a Guided Research Assistant organized around three explicit Research Tasks:

1. **Understand the Research** opens Paper Question Mode. This is the only task with free-form input, and every answer is limited to the ALIGATEHR-Gen paper.
2. **Explore Visualizations** presents three Visualization Destinations—Performance, Ablation, and Use Case—and opens the selected destination in the current tab. All chart interaction remains on the visualization page.
3. **Build a Demo Profile** transforms the same Assistant Shell into a staged Demo Profile Wizard. The visitor selects one Comparison Target, enters optional fields through reviewed controls, receives target-specific Coverage Guidance, reviews the Profile Draft, and explicitly confirms the comparison.

The Assistant remains one floating website surface, but each task receives an interface appropriate to its work. Paper questions remain conversational. Demo Profile creation becomes a wizard. Visualization selection becomes navigation. The system no longer asks an LLM to infer which task the visitor intended.

Matched cohort comparisons automatically hand off to the destination visualization, collapse the Assistant, highlight the Matched Reference Neighborhood, and show only a compact Matched Reference Summary. A No Stable Neighborhood remains in the Demo Profile Wizard and does not open a visualization.

## User Stories

1. As a first-time visitor, I want to see the supported Research Tasks immediately, so that I do not have to invent a prompt before understanding what the Assistant can do.
2. As a first-time visitor, I want the Assistant to describe each Research Task in plain English, so that I can choose the right path confidently.
3. As a returning visitor, I want the task menu to reflect resumable work, so that I can continue a Paper Question Session or Profile Session without starting over.
4. As a visitor, I want a persistent Back to tasks action, so that I can change goals without closing the Assistant.
5. As a visitor, I want closing and reopening the Assistant to restore my in-progress task, so that an accidental close does not lose my place.
6. As a visitor, I want task progress to remain scoped to the current tab, so that the website does not create a saved account record or cross-device history.
7. As a visitor, I want an explicit clear or start-over action, so that I control when a Paper Question Session or Profile Session is removed.
8. As a paper reader, I want to enter Paper Question Mode deliberately, so that I know every answer is constrained to the project paper.
9. As a paper reader, I want the composer placeholder to say that I am asking about the paper, so that the scope remains visible while I write.
10. As a paper reader who is unsure how to begin, I want reviewed example questions, so that I can understand the kinds of Research Questions the mode supports.
11. As a paper reader, I want clicking an example question to place editable text in the composer without sending it, so that I retain control over the final question.
12. As a paper reader, I want to edit and submit my own Research Question, so that the interaction remains flexible rather than becoming a fixed FAQ.
13. As a paper reader, I want the answer to use only the paper, so that it does not introduce unsupported external claims.
14. As a paper reader, I want the Assistant to say when the paper does not contain an answer, so that absence is not hidden by a guess.
15. As a paper reader, I want related question suggestions after an answer, so that I can continue exploring without needing to formulate every next question from scratch.
16. As a paper reader, I do not want a general-purpose chat mode, so that I am never left guessing whether a question is in scope.
17. As a visitor, I want visualization choices presented as Performance, Ablation, and Use Case destinations, so that they match the website's existing information architecture.
18. As a visitor, I want each Visualization Destination to explain what I can learn there, so that I can choose without knowing individual chart names.
19. As a visitor, I want a destination to open in the current tab and scroll to its main content, so that navigation feels like part of one website.
20. As a visitor, I want the Assistant to collapse after opening a visualization, so that it does not obscure the chart.
21. As a visitor, I want browser Back to work normally after opening a visualization, so that navigation remains predictable.
22. As a visualization user, I want filtering, search, highlight, walkthrough, replay, and reset controls to remain on the visualization page, so that chart state is not split across two interfaces.
23. As an ICD visualization user, I want to use the existing page interaction rather than a chatbot prompt, so that ICD exploration is self-contained.
24. As a Use Case visitor, I want Preset Walkthrough controls to remain on the visualization page, so that the Assistant does not duplicate the same workflow.
25. As a Demo Profile visitor, I want to enter through a concise Research Use Notice, so that the synthetic/de-identified data boundary is clear without filling the whole interface with disclaimer text.
26. As a Demo Profile visitor, I want to select exactly one Comparison Target before entering fields, so that the scope of the comparison is explicit.
27. As a Demo Profile visitor, I do not want the system to infer or recommend a Comparison Target, so that target selection is never mistaken for diagnosis.
28. As a Demo Profile visitor, I want the target selection to be described as a research cohort choice, so that it is not presented as a disease prediction.
29. As a Demo Profile visitor, I want to choose between building a profile and loading a Synthetic Example Profile, so that I can explore the workflow without providing personal information.
30. As a Demo Profile visitor, I want one reviewed Synthetic Example Profile for each Comparison Target, so that the example demonstrates an eligible target-specific coverage pattern.
31. As a Demo Profile visitor, I want Synthetic Example Profiles to remain editable and visibly labeled, so that I do not confuse them with Reference Patients or fixed results.
32. As a Demo Profile visitor, I want fields grouped into understandable steps, so that I can complete the profile without facing one long form.
33. As a Demo Profile visitor, I want Basic Information, Body Measurements, Blood Pressure and Labs, Lifestyle and Family Context, and Review to be distinct steps, so that related fields appear together.
34. As a Demo Profile visitor, I want every field to state that it is optional, so that the form does not resemble mandatory clinical intake.
35. As a Demo Profile visitor, I want target-recommended fields shown before additional optional fields, so that I know which information can help reach comparison eligibility.
36. As a Demo Profile visitor, I want all supported fields to remain available, so that target recommendations do not silently hide valid information.
37. As a Demo Profile visitor, I want units selected through controls rather than typed into a prompt, so that units are explicit and cannot be guessed from magnitude.
38. As a Demo Profile visitor, I want height, weight, waist, hip, creatinine, and HbA1c to support their reviewed unit choices, so that I can use familiar measurements.
39. As a Demo Profile visitor, I want fixed-unit fields such as age and blood pressure to display their units, so that interpretation is visible.
40. As a Demo Profile visitor, I want unit changes to convert the current value while preserving my original representation for review, so that conversion is transparent.
41. As a Demo Profile visitor, I want validation after leaving a field or continuing a step, so that feedback is timely without interrupting every keystroke.
42. As a Demo Profile visitor, I want empty optional fields to remain neutral, so that skipped information is not shown as an error.
43. As a Demo Profile visitor, I want entered fields to show Valid, Add a unit, Check this value, Outside reference support, or Conflict states, so that I know exactly what action is needed.
44. As a Demo Profile visitor, I want invalid or conflicting entered values to be editable or removable, so that I can resolve them without restarting the profile.
45. As a Demo Profile visitor, I want Outside Reference Support values preserved without clamping, so that the system does not silently change my input.
46. As a Demo Profile visitor, I want validation copy to avoid normal, abnormal, healthy, or unhealthy labels, so that the form does not provide medical judgment.
47. As a Demo Profile visitor, I want a domain-based Coverage Guidance checklist, so that I can see which kinds of information are represented.
48. As a Demo Profile visitor, I want Coverage Guidance to identify optional additions that can reach an eligible target-specific pattern, so that a disabled comparison action is actionable.
49. As a Demo Profile visitor, I do not want a coverage percentage or confidence label, so that Profile Coverage is not mistaken for model certainty.
50. As a Demo Profile visitor, I want comparison disabled until a reviewed target-specific coverage pattern is satisfied, so that missing fields are not imputed or treated as matches.
51. As a Demo Profile visitor, I want Add this information actions to take me to the relevant form section, so that resolving coverage gaps is direct.
52. As a Demo Profile visitor, I want a final review of the Comparison Target, Reported Features, Derived Match Features, and Profile Coverage, so that I know what will be compared.
53. As a Demo Profile visitor, I want to edit from the final review, so that confirmation is never the only available action.
54. As a Demo Profile visitor, I want one explicit Confirm and compare with reference cohort button without an extra checkbox, so that confirmation is deliberate but not repetitive.
55. As a Demo Profile visitor, I do not want comparison to start automatically when coverage becomes eligible, so that I retain control over the transition.
56. As a visitor with a Matched Reference Neighborhood, I want the website to open the destination visualization automatically after confirmation, so that I see the matched points in their intended context.
57. As a visitor with a matched result, I want the Assistant to collapse automatically, so that the visualization receives the available screen space.
58. As a visitor with a matched result, I want highlighted points to represent Reference Patients rather than a predicted Query Patient point, so that the chart does not imply an embedding inference that did not occur.
59. As a visitor with a matched result, I want a compact summary containing the Comparison Target, matched-reference count, and privacy-permitted median age and sex distribution, so that I can understand the highlight at a glance.
60. As a visitor with a matched result, I do not want a full results panel, so that the visualization remains the primary experience.
61. As a visitor with a matched result, I do not want risk, confidence, or similarity percentages, so that cohort comparison is not presented as a personal prediction.
62. As a visitor with No Stable Neighborhood, I want to remain in the Demo Profile Wizard, so that I am not sent to an empty visualization.
63. As a visitor with No Stable Neighborhood, I want a concise explanation and Edit Demo Profile, Start a new comparison, and Back to tasks actions, so that the honest no-result state has clear next steps.
64. As a visitor, I want the global research disclaimer to remain concise, so that it does not obscure task selection.
65. As a Demo Profile visitor, I want the full actionable privacy boundary shown at task entry and summarized at review, so that it appears where it affects my decisions.
66. As a visitor, I want backend readiness described as Preparing the research assistant rather than an HTTP error, so that infrastructure details do not become user instructions.
67. As a visitor, I want Retry, Continue editing, and Back to tasks actions after recoverable failures, so that I am never left at a dead end.
68. As a visitor, I want the backend to wake only after I select a task that needs it, so that ordinary page visits do not generate unnecessary service requests.
69. As a Demo Profile visitor, I want local wizard steps to remain usable while the backend wakes, so that cold start time does not block fields that need no server response.
70. As a mobile visitor, I want the Assistant to use a full-screen single-column layout, so that the task menu and wizard feel natural on a phone.
71. As a mobile Paper Question visitor, I want the composer to remain above the software keyboard, so that the current question stays visible.
72. As a mobile Demo Profile visitor, I want Back and Continue actions fixed above the safe area, so that wizard navigation remains reachable.
73. As a mobile visitor, I want closing the Assistant to restore the original page scroll position, so that the overlay does not disrupt browsing.
74. As a visitor, I want all Assistant UI and system copy in English, so that it remains consistent with the paper and website.
75. As a visitor, I want the Assistant to use the existing ALIGATEHR-Gen blue research visual language, so that it feels integrated with the site.
76. As a visitor, I want task cards, wizard controls, and conversational elements to use a consistent visual system, so that the interface is understandable without AI-themed decoration.

## Implementation Decisions

- The product is named the **Guided Research Assistant** in user-facing and domain language. It must not be presented as a generic chatbot.
- One **Assistant Shell** hosts task selection and task-specific views. It does not create a separate application route.
- The initial view is a **Research Task Menu** with exactly three primary tasks: Understand the Research, Explore Visualizations, and Build a Demo Profile.
- No general chat composer or Ask a custom question path is exposed.
- **Paper Question Mode** is the only free-form mode. It uses an explicit paper-only backend contract and bypasses LLM intent classification.
- Paper Question Mode displays reviewed example questions. Selecting one fills the composer without submitting it. Answers remain paper-grounded, explicitly acknowledge missing paper information, and do not add paper-section links or external sources.
- **Explore Visualizations** contains exactly three destination cards: Performance, Ablation, and Use Case. Cards explain the learning goal and open the destination in the current tab.
- Visualization navigation collapses the Assistant. Filtering, search, highlight, walkthrough, replay, reset, and explanatory chart interaction remain owned by visualization pages.
- The existing ICD visualization interaction remains page-owned and is not redesigned with new reviewed-keyword shortcut buttons in this scope.
- The existing Preset Walkthrough card is removed from the Assistant. Preset controls remain on the Use Case visualization page.
- **Build a Demo Profile** transforms the Assistant Shell into a wider staged **Demo Profile Wizard** rather than a chat transcript.
- The Demo Profile Wizard begins with the layered Research Use Notice, followed by required selection of exactly one Comparison Target. The system does not infer, recommend, or substitute a target.
- The supported Comparison Targets remain the seven approved fibrotic reference categories.
- After target selection, the visitor chooses to build a profile or load the reviewed **Synthetic Example Profile** associated with that target.
- Seven versioned Synthetic Example Profiles are maintained as reviewed backend data. They are not generated by an LLM, copied from a Reference Patient, confirmed automatically, or compared automatically.
- The guided form is divided into Basic Information, Body Measurements, Blood Pressure and Labs, Lifestyle and Family Context, and Review.
- No individual field is universally required. Target recommendations reorder or emphasize useful fields without hiding the rest of the Matchable Feature Schema.
- Unit controls replace typed units. Reviewed choices include feet/inches or centimeters, pounds or kilograms, inches or centimeters for circumferences, milligrams per deciliter or micromoles per liter for creatinine, and percent or millimoles per mole for HbA1c. Age and blood pressure use visible fixed units.
- Field validation occurs on field exit and step continuation. Blank optional fields are neutral. Entered fields use the existing deterministic status vocabulary and never apply clinical normal/abnormal labels.
- The UI preserves original values and units, shows deterministic conversions and Derived Match Features, and never clamps Outside Reference Support values.
- Target-specific **Coverage Guidance** is available before confirmation. No field is individually mandatory, but the comparison action is unavailable until the Profile Draft satisfies a reviewed target-specific coverage pattern.
- Coverage Guidance is domain-based and actionable. It does not expose percentage completion, confidence, or match accuracy.
- The final review shows the Comparison Target, Reported Features, Derived Match Features, Profile Coverage, and the short Research Use Notice.
- **Confirm and compare with reference cohort** is the sole explicit confirmation action. No separate affirmation checkbox is used.
- New task-specific backend contracts replace intent routing in the public UI: paper-only questions, structured profile validation, target-aware coverage, profile confirmation, and profile matching. Legacy general chat and text-extraction capabilities may remain for compatibility but are not used by the public Guided Research Assistant.
- A matched comparison creates a Visualization Request, opens the destination visualization automatically in the current tab, and collapses the Assistant.
- The visualization highlights the Matched Reference Neighborhood and displays only a **Matched Reference Summary**: Comparison Target, matched-reference count, and privacy-permitted median age and sex distribution.
- The Matched Reference Summary excludes risk scores, confidence, similarity percentages, full Profile Coverage, detailed aggregate tables, and a separate results panel.
- A No Stable Neighborhood does not create a Visualization Request. It remains in the Demo Profile Wizard with concise explanatory copy and Edit Demo Profile, Start a new comparison, and Back to tasks actions.
- Paper Question Sessions and Profile Sessions remain in tab-scoped storage while the visitor switches tasks. They end only through explicit clear/start-over actions or tab closure.
- The first Assistant open shows the Research Task Menu. Reopening during an active task restores that task. Reopening after a completed comparison returns to the menu with an edit-or-restart Profile action.
- Existing persisted UI markup from the previous chatbot must not be restored into the new Assistant Shell. Client-side state requires an explicit version boundary or migration.
- The global notice remains one concise research-prototype sentence. The actionable synthetic/de-identified restriction appears when entering the Demo Profile Wizard and is summarized at review. No consent checkbox is added.
- The backend is checked and woken when a backend-dependent task is selected, not on every page load. Readiness and failure states use user-facing language and explicit recovery actions rather than HTTP status text.
- The mobile Assistant is full-screen and single-column. Its header and wizard actions remain fixed, its content scrolls independently, and controls respect the software keyboard and safe area.
- The interface is English-only for this release.
- The visual design extends the existing ALIGATEHR-Gen blue theme, typography, light/dark theme behavior, spacing, cards, and restrained borders. It does not use generic AI decoration or prediction-oriented visual language.
- The existing privacy boundary remains authoritative: no identifying information, real medical records, private matching rows, credentials, or raw participant identifiers are exposed through the Assistant or visualization handoff.

## Testing Decisions

- The primary acceptance seam is the real browser-visible Guided Research Assistant journey against the public frontend/backend boundary. Tests should assert user-visible states and transitions rather than internal functions, DOM construction order, prompt strings, or implementation-specific component structure.
- One browser acceptance matrix should cover the task menu, all three task entries, task switching, session restoration, mobile layout, backend readiness, recoverable errors, matched handoff, and No Stable Neighborhood behavior.
- Paper Question Mode browser coverage should verify that the composer exists only in that mode, example questions fill without sending, paper questions receive paper-grounded answers, out-of-scope questions receive the explicit scope response, and no general chat path is exposed.
- Visualization browser coverage should verify that Performance, Ablation, and Use Case open in the current tab, the Assistant collapses, the destination page owns controls, the Assistant has no Preset Walkthrough card, and ICD interaction does not depend on an Assistant prompt.
- Demo Profile browser coverage should exercise a manually entered profile and a Synthetic Example Profile through target selection, unit controls, per-step validation, Coverage Guidance, review, confirmation, matching, visualization handoff, and state restoration.
- Each of the seven Synthetic Example Profiles must pass the same public validation, coverage, confirmation, and matching contracts used by visitor-entered profiles. Tests should not bypass those contracts through fixtures that cannot occur in production.
- Profile edge-state coverage should include blank optional fields, ambiguous units, invalid values, conflicting values, Outside Reference Support, insufficient coverage, matched comparison, No Stable Neighborhood, backend cold start, timeout, and retry.
- Matched-result browser coverage should assert that highlighted Visual Reference IDs exist in the authoritative display release, that the Assistant collapses, and that only the compact Matched Reference Summary appears near the chart.
- Privacy tests should assert that the compact summary and visualization request expose no private feature rows, participant identifiers, full individual profiles, risk score, confidence, or similarity percentage.
- No-stable-neighborhood tests should assert that no visualization navigation occurs and that the Wizard exposes the three agreed recovery actions.
- Backend contract tests should cover the explicit paper-only endpoint, target-aware coverage contract, Synthetic Example Profile retrieval, structured confirmation, matching outcomes, and privacy-safe compact-summary fields.
- Backend tests should prove that the public Guided Research Assistant path does not call intent classification or free-text Feature Candidate extraction for visualization or Demo Profile tasks.
- Frontend contract tests should cover the Assistant task state machine, tab-scoped restoration, storage-version boundary, task-specific composer visibility, wizard navigation, unit control behavior, and visualization handoff payload.
- Existing prior art should be extended rather than replaced: browser acceptance for preset/profile/ICD journeys, JavaScript public-contract and profile-session tests, deterministic visualization request tests, and FastAPI ASGI endpoint tests.
- Visual regression checks should cover desktop task menu, desktop Paper Question Mode, expanded desktop Demo Profile Wizard, mobile full-screen task menu, mobile composer with software-keyboard-safe layout, mobile wizard, matched chart summary, and No Stable Neighborhood.
- Build verification remains required after frontend changes, including published OJS asset validation and a full site render.
- A good test fails only when visitor-visible behavior or a public data/privacy contract changes. Tests must not freeze incidental CSS class names, exact internal function decomposition, or full LLM prose beyond required scope and safety statements.

## Out of Scope

- A validated personal risk-prediction model, risk score, prognosis, diagnosis, treatment recommendation, or calibrated prediction confidence.
- A similarity percentage or conversion of reference-neighborhood distance into a user-facing score.
- A full comparison-results dashboard, detailed aggregate tables, or long-form results panel beside the visualization.
- General-purpose chat, open-domain questions, external web search, or external-source citations.
- Paper-section links or per-answer citation navigation in Paper Question Mode.
- Natural-language Demo Profile entry in the public UI. The backend text extractor may remain for compatibility.
- Removing legacy general chat or text-extraction backend endpoints solely because the new UI no longer uses them.
- LLM-generated Synthetic Example Profiles or examples copied from Reference Patients.
- Automatic Comparison Target selection, target recommendations, or a Not sure fallback.
- New ICD reviewed-keyword shortcut buttons or a redesign of the existing ICD visualization interaction.
- Assistant-owned visualization filtering, search, highlight, playback, replay, or reset controls.
- A separate Assistant application page or route.
- User accounts, server-side conversation history, cross-tab persistence, cross-device synchronization, or long-term Profile storage.
- A bilingual or localized UI. This release is English-only.
- Formal WCAG certification. Normal semantic controls and natural mobile behavior remain expected, but a separate accessibility certification program is not part of this spec.
- Changes to the underlying profile-similarity algorithm, calibrated thresholds, Dataset Release generation, private matching artifact, or clinical-governance boundary except where a new public contract is required to expose already-reviewed behavior.

## Further Notes

- This spec uses the domain language in the project glossary and is governed by the accepted decisions for guided forms, paper-only free text, explicit Research Task routing, task-specific Assistant views, and visualization-owned matched-reference presentation.
- The earlier chatbot-driven comparison PRD remains historical context, but its generic-chat, free-text profile, Assistant-owned visualization control, and Assistant result-card assumptions are superseded by this spec.
- The Assistant redesign should be implemented without rewriting historical deployment or feature documentation. Any future deployment or data-boundary change should be recorded as a new dated note or ADR.
- The public frontend and production backend are deployed from separate repositories. Backend contract changes must be synchronized to the production backend mirror and verified at the real public seam before the feature is considered complete.
