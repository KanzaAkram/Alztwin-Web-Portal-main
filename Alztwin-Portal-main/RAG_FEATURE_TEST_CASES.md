# RAG Feature Test Cases

## Scope
This document covers manual test cases for the RAG-based clinician recommendation feature shown in the Digital Twin workflow as the `Trials-backed Support` panel.

Primary areas covered:
- Accessing the RAG panel
- AI context visibility
- Editable clinical input fields
- Support-plan generation
- Loading, empty, and error states
- Evidence source display
- Disclaimer visibility
- Saved recommendation history
- Viewing past support plans

## Recommended Screenshot Naming
Use these screenshot names in your report:

- `RAG01_Panel_Opened.png`
- `RAG02_No_AI_Context.png`
- `RAG03_AI_Context_Cards.png`
- `RAG04_Editable_Inputs.png`
- `RAG05_Empty_State.png`
- `RAG06_Loading_State.png`
- `RAG07_Result_Treatment.png`
- `RAG08_Rationale_Cards.png`
- `RAG09_Evidence_Sources.png`
- `RAG10_Disclaimer.png`
- `RAG11_History_List.png`
- `RAG12_Viewing_Past_Plan.png`
- `RAG13_Error_State.png`
- `RAG14_Updated_Input_Result.png`

## Common Preconditions
- User is logged in as a clinician.
- Clinician dashboard is accessible.
- At least one patient exists and is selectable in the Digital Twin workflow.
- Firebase/Firestore is connected.
- RAG API endpoint is available for positive-generation tests.
- For AI-context tests, the patient may or may not have an `aiAnalyses` record depending on the case.

## Test Case Format
- `Test Case ID`
- `Title`
- `Preconditions`
- `Steps`
- `Expected Result`
- `Screenshot to Capture`

---

## TC-RAG-01
**Title:** Open RAG support panel from Digital Twin workflow

**Preconditions:**
- Clinician is logged in.
- A patient is available.

**Steps:**
1. Open the clinician dashboard.
2. Select a patient in the Digital Twin area.
3. Open the `Trials-backed Support` tab/panel.

**Expected Result:**
- RAG recommendation panel opens successfully.
- Header shows `Clinical Trials-backed Treatment Support`.
- Generate button is visible.
- Editable clinical inputs section is visible.

**Screenshot to Capture:**
- Full RAG panel view.
- Suggested file: `RAG01_Panel_Opened.png`

---

## TC-RAG-02
**Title:** Verify no-AI-context message when no AI analysis exists

**Preconditions:**
- Patient does not have a latest `aiAnalyses` record.
- RAG panel is open.

**Steps:**
1. Open the RAG support panel for a patient with no AI analysis history.

**Expected Result:**
- Informational warning is shown.
- Message indicates no AI stage/progression analysis is available yet.
- User is guided to run stage and progression diagnostics first.

**Screenshot to Capture:**
- No-AI-context info message.
- Suggested file: `RAG02_No_AI_Context.png`

---

## TC-RAG-03
**Title:** Verify AI current stage and progression forecast cards

**Preconditions:**
- Patient has at least one `aiAnalyses` record.
- RAG panel is open.

**Steps:**
1. Open the RAG support panel for a patient with AI analysis history.
2. Review the AI context section at the top.

**Expected Result:**
- `AI Current Stage` card is visible.
- `AI Progression Forecast` card is visible.
- Context may include stage label, confidence, progression forecast, and analysis timestamp.
- Stage input is auto-synced from latest AI analysis.

**Screenshot to Capture:**
- Both AI context cards visible together.
- Suggested file: `RAG03_AI_Context_Cards.png`

---

## TC-RAG-04
**Title:** Verify editable clinical input fields are available

**Preconditions:**
- RAG panel is open.

**Steps:**
1. Review the `Clinical Inputs (editable)` section.
2. Check the following fields:
   - Age
   - Stage
   - Evidence Sources (Top K)
   - Sleep Quality
   - Sleep Hours
   - Systolic BP
   - Diastolic BP
   - Heart Rate
   - Comorbidities
   - Current Medications

**Expected Result:**
- All listed fields are visible and editable.
- Some fields are prefilled from patient/device data when available.

**Screenshot to Capture:**
- Clinical Inputs section with values shown.
- Suggested file: `RAG04_Editable_Inputs.png`

---

## TC-RAG-05
**Title:** Verify empty state when no saved support plan exists

**Preconditions:**
- Selected patient has no saved `ragRecommendations`.
- RAG API has not been triggered in current context.

**Steps:**
1. Open the RAG panel for a patient with no prior recommendation history.

**Expected Result:**
- Empty-state panel is shown.
- Message indicates there are no previous support plans.
- User is prompted to click `Generate Support Plan`.

**Screenshot to Capture:**
- Empty state in RAG panel.
- Suggested file: `RAG05_Empty_State.png`

---

## TC-RAG-06
**Title:** Generate support plan successfully

**Preconditions:**
- RAG panel is open.
- API endpoint is reachable.

**Steps:**
1. Review or edit the clinical inputs.
2. Click `Generate Support Plan`.

**Expected Result:**
- Button changes to loading state.
- Request is sent to the RAG API.
- A recommendation result is returned and displayed.
- A new record is attempted to be saved in `patients/{patientId}/ragRecommendations`.

**Screenshot to Capture:**
- Loading spinner immediately after clicking generate.
- Suggested file: `RAG06_Loading_State.png`

---

## TC-RAG-07
**Title:** Verify generated treatment result card

**Preconditions:**
- TC-RAG-06 completed successfully.

**Steps:**
1. Review the top section of the generated result.

**Expected Result:**
- Result header shows patient ID and stage.
- Evidence source count is displayed.
- Main treatment card shows:
  - treatment option
  - dosage if available

**Screenshot to Capture:**
- Treatment result card with stage and patient details.
- Suggested file: `RAG07_Result_Treatment.png`

---

## TC-RAG-08
**Title:** Verify clinical rationale, cautions, monitoring, and lifestyle sections

**Preconditions:**
- A support plan has been generated.

**Steps:**
1. Scroll through the result area.
2. Review the explanatory sections.

**Expected Result:**
- `Clinical Rationale` section is visible if returned by API.
- Bullet-card sections display:
  - `Cautions`
  - `Monitoring`
  - `Lifestyle Notes`
- Returned items are shown in list format.

**Screenshot to Capture:**
- Rationale and bullet-card sections.
- Suggested file: `RAG08_Rationale_Cards.png`

---

## TC-RAG-09
**Title:** Verify evidence source list is displayed

**Preconditions:**
- Generated support plan includes source references.

**Steps:**
1. Scroll to `Clinical Trial & Literature Sources`.
2. Review listed evidence entries.

**Expected Result:**
- Source list is visible.
- Each source entry may show:
  - title
  - source label
  - document ID
  - relevance score
  - external-link icon

**Screenshot to Capture:**
- Evidence source cards/list.
- Suggested file: `RAG09_Evidence_Sources.png`

---

## TC-RAG-10
**Title:** Verify disclaimer is displayed with generated result

**Preconditions:**
- Generated support plan includes a disclaimer.

**Steps:**
1. Review the lower section of the generated result.

**Expected Result:**
- Disclaimer block is visible.
- It appears in a highlighted caution/warning style.

**Screenshot to Capture:**
- Disclaimer section.
- Suggested file: `RAG10_Disclaimer.png`

---

## TC-RAG-11
**Title:** Verify support plan history is shown after generation

**Preconditions:**
- At least one support plan exists for the selected patient.

**Steps:**
1. Open the RAG panel.
2. Scroll to `Support Plan History`.

**Expected Result:**
- History section is visible with count.
- Each history item shows:
  - stage badge
  - created date/time
  - treatment summary
  - dosage preview if available
  - number of sources
- Latest item is marked as `Latest`.

**Screenshot to Capture:**
- Support Plan History list.
- Suggested file: `RAG11_History_List.png`

---

## TC-RAG-12
**Title:** Open a past support plan from history

**Preconditions:**
- At least two support plans exist for the patient.

**Steps:**
1. Open `Support Plan History`.
2. Click an older history record instead of the latest one.

**Expected Result:**
- Older support plan loads in the result view.
- Banner indicates `Viewing past support plan`.
- `Jump to latest` button is displayed.

**Screenshot to Capture:**
- Viewing-past-plan banner with older result.
- Suggested file: `RAG12_Viewing_Past_Plan.png`

---

## TC-RAG-13
**Title:** Return from past plan to latest plan

**Preconditions:**
- User is currently viewing an older support plan.

**Steps:**
1. Click `Jump to latest`.

**Expected Result:**
- Latest saved support plan is loaded.
- Banner changes from past-plan state to latest-plan state.

**Screenshot to Capture:**
- Latest-plan banner after returning.

---

## TC-RAG-14
**Title:** Refresh support plan using changed clinical inputs

**Preconditions:**
- At least one result already exists in the panel.

**Steps:**
1. Change one or more input values such as:
   - Stage
   - Top K
   - Sleep Quality
   - Medications
2. Click `Refresh Plan`.

**Expected Result:**
- Button label shows `Refresh Plan`.
- New request is generated using updated input values.
- New result is displayed.
- New history record is added at the top of the history list.

**Screenshot to Capture:**
- Changed inputs with refreshed result and updated history.
- Suggested file: `RAG14_Updated_Input_Result.png`

---

## TC-RAG-15
**Title:** Verify error handling when RAG API call fails

**Preconditions:**
- API endpoint is unavailable, misconfigured, or returns an error.
- RAG panel is open.

**Steps:**
1. Click `Generate Support Plan`.
2. Wait for the failed response.

**Expected Result:**
- Error banner is displayed in the panel.
- Error text is shown in a red warning container.
- No successful result card is rendered for the failed request.

**Screenshot to Capture:**
- Error message state.
- Suggested file: `RAG13_Error_State.png`

---

## TC-RAG-16
**Title:** Verify source count matches visible evidence list

**Preconditions:**
- A support plan has been generated with sources.

**Steps:**
1. Note the evidence source count shown in the result header.
2. Scroll to the evidence list and count the visible entries.

**Expected Result:**
- Source count in the header matches the number of evidence items shown in the list.

**Screenshot to Capture:**
- Result header and source list.

---

## TC-RAG-17
**Title:** Verify support plan history loads automatically for patient with saved records

**Preconditions:**
- Patient already has saved `ragRecommendations` records in Firestore.

**Steps:**
1. Open the RAG panel for that patient.

**Expected Result:**
- Existing history loads automatically.
- Latest saved support plan becomes the active displayed result.
- Latest entry is highlighted.

**Screenshot to Capture:**
- Auto-loaded result with history list visible.

---

## TC-RAG-18
**Title:** Verify patient switch resets RAG panel to new patient context

**Preconditions:**
- Two patients are available.
- At least one of them has different recommendation history or AI context.

**Steps:**
1. Open RAG panel for Patient A.
2. Observe result/history/context.
3. Switch to Patient B.

**Expected Result:**
- Result, history, active history selection, and error state reset for the new patient.
- New patient’s AI context and saved plans load independently.

**Screenshot to Capture:**
- Before and after patient switch.

---

## Extra Evidence You Can Attach
- RAG panel opened inside Digital Twin workflow
- Empty state before first generation
- AI context cards from latest analysis
- Filled editable inputs
- Loading spinner during generation
- Treatment recommendation card
- Rationale, cautions, monitoring, lifestyle sections
- Evidence sources with titles and relevance scores
- Disclaimer panel
- History list with latest marker
- Past-plan banner with `Jump to latest`
- Error banner when API fails

## Notes for Report Writing
- Mention that the RAG feature is clinician-facing and appears inside the Digital Twin workflow.
- Mention that the feature combines editable clinical inputs with AI-derived context from the latest patient analysis.
- Mention that generated support plans are best-effort persisted to `patients/{patientId}/ragRecommendations`.
- Mention that the feature shows literature/trial evidence sources and can reload older recommendation history.
