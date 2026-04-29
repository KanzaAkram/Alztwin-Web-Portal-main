# Black-Box Testing — Digital Twin Feature (Decision Table Technique)

## 1. Introduction

This document presents black-box test cases for the **Digital Twin** feature of the Alztwin Portal, designed using the **Decision Table Testing** technique. Decision table testing is a black-box technique used when the behaviour of a system depends on combinations of input conditions. It is particularly suitable for the Digital Twin module because its output (whether a 3D twin is generated, loaded from the database, or rejected) depends on multiple factors such as user authentication, MRI upload status, presence of MRI in the database, and file validity.

The **Digital Twin** feature creates a virtual 3D representation of a patient's brain using uploaded MRI/DICOM scan data. In the Alztwin Portal, this feature helps clinicians and caregivers visualize brain reconstruction, run AI-based diagnostic analysis, view Alzheimer's disease stage predictions, inspect risk scores, and track disease progression over time. Instead of relying only on static medical records, the Digital Twin provides an interactive patient-specific model that can support monitoring, comparison, and clinical decision-making.

The standard procedure for decision table testing has three steps:

1. **Identify** the conditions (inputs) and actions (outputs).
2. **Construct the full (expanded) decision table** — list every possible combination of conditions, i.e. **2ⁿ rules** for *n* binary conditions, and mark which action(s) each rule triggers.
3. **Reduce the decision table** — merge rules that produce identical actions by replacing the differing condition values with a "don't-care" symbol (–). This produces the minimum set of test cases that still gives full coverage.

## 2. Conditions and Actions

### Conditions

| ID | Condition |
|----|-----------|
| C1 | User is authenticated (caregiver/clinician logged in with a patient selected) |
| C2 | MRI image is uploaded by the caregiver in the current session |
| C3 | MRI image already present in the database for the patient |
| C4 | Uploaded MRI is a valid DICOM (.dcm) file |

### Actions

| ID | Action |
|----|--------|
| A1 | Generate new Digital Twin (3D brain model) |
| A2 | Load existing Digital Twin from database |
| A3 | Prompt user to upload MRI |
| A4 | Display invalid-file / format error |
| A5 | Block access to feature |

## 3. Full (Expanded) Decision Table

All 2⁴ = **16 combinations** of the four conditions are enumerated. Y = Yes, N = No, X = action performed.

| Rule | C1 Authenticated | C2 Upload now | C3 In DB | C4 Valid DICOM | A1 Generate | A2 Load | A3 Prompt | A4 Format Err | A5 Block |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| R1  | Y | Y | Y | Y | X | – | – | – | – |
| R2  | Y | Y | Y | N | – | – | – | X | – |
| R3  | Y | Y | N | Y | X | – | – | – | – |
| R4  | Y | Y | N | N | – | – | – | X | – |
| R5  | Y | N | Y | Y | – | X | – | – | – |
| R6  | Y | N | Y | N | – | X | – | – | – |
| R7  | Y | N | N | Y | – | – | X | – | – |
| R8  | Y | N | N | N | – | – | X | – | – |
| R9  | N | Y | Y | Y | – | – | – | – | X |
| R10 | N | Y | Y | N | – | – | – | – | X |
| R11 | N | Y | N | Y | – | – | – | – | X |
| R12 | N | Y | N | N | – | – | – | – | X |
| R13 | N | N | Y | Y | – | – | – | – | X |
| R14 | N | N | Y | N | – | – | – | – | X |
| R15 | N | N | N | Y | – | – | – | – | X |
| R16 | N | N | N | N | – | – | – | – | X |

**Notes on rule logic:**
- When the user is not authenticated (C1 = N) the system blocks access regardless of any other condition.
- When no upload happens in the current session (C2 = N), the validity condition C4 has no effect because there is no new file to validate.
- When an MRI exists in the database (C3 = Y) and no new upload is made, the cached Digital Twin is loaded.

## 4. Reduced Decision Table

Rules with identical actions are collapsed by replacing the differing condition values with "–" (don't-care).

**Reduction analysis:**

| Merged from | Differs in | Reduced rule | Action |
|---|---|---|---|
| R1, R3 | C3 | (Y, Y, –, Y) | A1: Generate |
| R2, R4 | C3 | (Y, Y, –, N) | A4: Format Err |
| R5, R6 | C4 | (Y, N, Y, –) | A2: Load |
| R7, R8 | C4 | (Y, N, N, –) | A3: Prompt |
| R9 – R16 | C2, C3, C4 | (N, –, –, –) | A5: Block |

**Reduced Decision Table (5 rules, replacing the original 16):**

T = True/Yes, F = False/No, – = don't-care, ✓ = action performed.

**Note:** Rule numbers and action numbers are separate. For example, **R2′** means "Reduced Rule 2", while **A2** means "Action 2: Load existing Digital Twin". Therefore, the load-existing-DT action appears under **R3′**, not R2′.

| Condition / Action | R1′ | R2′ | R3′ | R4′ | R5′ |
|---|:-:|:-:|:-:|:-:|:-:|
| C1: User is authenticated | T | T | T | T | F |
| C2: MRI uploaded in current session | T | T | F | F | – |
| C3: MRI already present in database | – | – | T | F | – |
| C4: Uploaded MRI is valid DICOM | T | F | – | – | – |
| A1: Generate new Digital Twin | ✓ |  |  |  |  |
| A2: Load existing Digital Twin |  |  | ✓ |  |  |
| A3: Prompt user to upload MRI |  |  |  | ✓ |  |
| A4: Display invalid-file / format error |  | ✓ |  |  |  |
| A5: Block access to feature |  |  |  |  | ✓ |

This reduces the original **16 raw combinations** to **5 unique test cases** while preserving full coverage of every distinct action.

## 5. Test Cases

### TC-DT-01 — Generate New Digital Twin (Happy Path)
- **Rule covered:** R1′
- **Preconditions:** Caregiver logged in; patient "John Doe" selected; valid DICOM files available
- **Test Steps:**
  1. Navigate to Digital Twin section
  2. Click "Upload DICOM Folder"
  3. Select a folder containing valid `.dcm` files
  4. Click "Run AI Diagnostics"
- **Expected Output:** 3D brain model rendered; stage, risk score, and progression chart displayed; analysis record saved in Firestore
- **Actual Output:** _____________
- **Status:** Pass / Fail

### TC-DT-02 — Load Existing Digital Twin from Database
- **Rule covered:** R3′
- **Preconditions:** Caregiver logged in; patient selected; MRI and prior analysis already exist in the database; no new upload performed
- **Test Steps:**
  1. Open Digital Twin section
  2. Select a patient with previously stored data
- **Expected Output:** Existing 3D model and stage data load automatically from Firestore cache; no re-upload required
- **Actual Output:** _____________
- **Status:** Pass / Fail

### TC-DT-03 — No MRI Uploaded and None in Database
- **Rule covered:** R4′
- **Preconditions:** Caregiver logged in; new patient selected; database has no MRI for this patient
- **Test Steps:**
  1. Open Digital Twin section
  2. Select patient
- **Expected Output:** UI displays *"No Brain Reconstruction"* message with an "Upload DICOM" prompt button
- **Actual Output:** _____________
- **Status:** Pass / Fail

### TC-DT-04 — Upload Invalid DICOM Files
- **Rule covered:** R2′
- **Preconditions:** Caregiver logged in; patient selected; invalid files uploaded
- **Test Steps:**
  1. Click "Upload DICOM Folder"
  2. Select a folder containing invalid DICOM files or unsupported file formats
- **Expected Output:** Error *"Invalid file format"* displayed; upload rejected; Digital Twin not generated
- **Actual Output:** Format validation error displayed; upload rejected
- **Status:** Pass

### TC-DT-05 — Unauthenticated User Attempts Access
- **Rule covered:** R5′
- **Preconditions:** User not logged in (or no patient selected)
- **Test Steps:**
  1. Navigate directly to the Digital Twin URL
- **Expected Output:** Access blocked; user redirected to login page; Digital Twin feature is not rendered
- **Actual Output:** _____________
- **Status:** Pass / Fail

## 6. Coverage Summary

| Metric | Value |
|---|---|
| Conditions tested | 4 |
| Rules in full decision table | 16 |
| Rules in reduced decision table | 5 |
| Test cases generated | 5 (one per reduced rule) |
| Reduction efficiency | 16 → 5 (≈ 69% reduction) |
| Defect-detection focus | Input validation, authentication, file-format handling, database-state-dependent behaviour |

## 7. Conclusion

The decision table testing technique was applied in two stages: first an **expanded table** of all 16 possible combinations of the four conditions was constructed to ensure no scenario is missed; then the table was **reduced** by merging rules with identical actions using don't-care entries, yielding 5 unique test cases. This systematic process gives a traceable, minimal-yet-complete test suite for the Digital Twin feature and demonstrates conformance to the standard decision table testing methodology.
