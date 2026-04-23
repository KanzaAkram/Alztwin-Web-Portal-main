# Teleconsultation Feature Test Cases

## Scope
This document covers manual test cases for the clinician-side Teleconsultation feature implemented in the dashboard.

Primary areas covered:
- Teleconsultation hub access
- Patient search and risk filters
- Consultation scheduling modal
- Starting and joining a video consultation
- In-call controls
- Clinical summary and call notes
- Consultation history
- Firestore/session behavior visible from UI

## Recommended Screenshot Naming
Use these screenshot names in your report so everything stays organized:

- `TC01_Hub_Loaded.png`
- `TC02_Search_Filter.png`
- `TC03_Risk_Filter.png`
- `TC04_Schedule_Modal_Open.png`
- `TC05_Schedule_Success.png`
- `TC06_Start_Call_No_Patient.png`
- `TC07_Start_Call_No_Incoming_Request.png`
- `TC08_Connecting_State.png`
- `TC09_Call_Connected.png`
- `TC10_Toggle_Audio.png`
- `TC11_Toggle_Video.png`
- `TC12_Patient_Panel_Open.png`
- `TC13_Call_Notes_Entered.png`
- `TC14_Call_Ended_History.png`
- `TC15_Upcoming_List.png`
- `TC16_History_List.png`

## Common Preconditions
- User is logged in as a clinician.
- Clinician dashboard is accessible.
- At least 2 patients are linked to the clinician account.
- At least 1 patient has a visible diagnosis and risk level.
- Browser permission prompts for camera and microphone can be controlled during testing.
- Firebase/Firestore is connected for call-session testing.
- For call connection tests, a caregiver/patient app creates a `waiting` consultation session first.

## Test Case Format
- `Test Case ID`
- `Title`
- `Preconditions`
- `Steps`
- `Expected Result`
- `Screenshot to Capture`

---

## TC-01
**Title:** Open Teleconsultation hub from clinician dashboard

**Preconditions:**
- Clinician is logged in.

**Steps:**
1. Open the clinician dashboard.
2. Click `Teleconsultation` from the left sidebar.

**Expected Result:**
- Teleconsultation page opens successfully.
- Header shows `Teleconsultation`.
- Page displays summary cards such as `Total Calls`, `This Week`, `Avg Duration`, and `Live Now`.
- Sections for `Start a Consultation`, `Upcoming`, and `Consultation History` are visible.

**Screenshot to Capture:**
- Full Teleconsultation hub page.
- Suggested file: `TC01_Hub_Loaded.png`

---

## TC-02
**Title:** Search patient in Start a Consultation list

**Preconditions:**
- Teleconsultation hub is open.
- More than one patient exists in the list.

**Steps:**
1. Locate the `Search patients...` field.
2. Enter a valid patient name.
3. Observe the filtered patient list.
4. Clear the search value.

**Expected Result:**
- Only matching patients are shown while typing.
- Search works against patient name, patient ID, or diagnosis.
- Clearing the field restores the complete patient list.

**Screenshot to Capture:**
- Search box with filtered patient result.
- Suggested file: `TC02_Search_Filter.png`

---

## TC-03
**Title:** Filter patients by risk level

**Preconditions:**
- Teleconsultation hub is open.
- Patients have risk levels such as `high`, `medium`, or `low`.

**Steps:**
1. Click the `high` risk chip.
2. Verify the list refreshes.
3. Click the `medium` risk chip.
4. Click the `low` risk chip.
5. Click `all`.

**Expected Result:**
- Only patients matching the selected risk level are displayed.
- Count on each chip is visible.
- Clicking `all` restores the full list.

**Screenshot to Capture:**
- Risk chip selected and filtered patient list.
- Suggested file: `TC03_Risk_Filter.png`

---

## TC-04
**Title:** Open Schedule Consultation modal from Teleconsultation hub

**Preconditions:**
- Teleconsultation hub is open.

**Steps:**
1. Click the `Schedule` button in the page header.

**Expected Result:**
- `Schedule Consultation` modal opens.
- Modal contains:
  - `Select Patient`
  - `Date`
  - `Time`
  - `Consultation Type`
  - `Notes (Optional)`
  - notification message for patient/caregiver
- `Cancel` and `Schedule` buttons are visible.

**Screenshot to Capture:**
- Schedule Consultation modal.
- Suggested file: `TC04_Schedule_Modal_Open.png`

---

## TC-05
**Title:** Schedule consultation successfully from modal

**Preconditions:**
- Schedule modal is open.
- At least one patient is available in dropdown.

**Steps:**
1. Select a patient.
2. Select a valid future date.
3. Select a valid time.
4. Enter optional notes.
5. Click `Schedule`.

**Expected Result:**
- Success alert appears with message `Consultation scheduled successfully!`
- Modal closes.
- Selected patient context is cleared.

**Important Note:**
- In the current implementation, this action shows a success alert and closes the modal, but no persistent scheduling save is visible in code from this modal flow.

**Screenshot to Capture:**
- Success alert after clicking `Schedule`.
- Suggested file: `TC05_Schedule_Success.png`

---

## TC-06
**Title:** Open schedule modal from patient row

**Preconditions:**
- Teleconsultation patient list is visible.

**Steps:**
1. Click `Schedule` for a specific patient row.

**Expected Result:**
- Schedule modal opens.
- The clicked patient is preselected in the `Select Patient` dropdown.

**Screenshot to Capture:**
- Modal showing the selected patient already populated.

---

## TC-07
**Title:** Start consultation without selecting a patient

**Preconditions:**
- Clinician dashboard is open.
- No patient is selected for call context.

**Steps:**
1. Trigger `Start Consultation` without selecting a patient.

**Expected Result:**
- Alert appears: `Select a patient before starting a consultation.`
- Video call modal should not proceed to an active call state.

**Screenshot to Capture:**
- Alert for no patient selected.
- Suggested file: `TC06_Start_Call_No_Patient.png`

---

## TC-08
**Title:** Start consultation when no waiting session exists

**Preconditions:**
- A patient is available in the list.
- No `waiting` consultation session exists in Firestore for that patient and clinician.

**Steps:**
1. Click `Call` or `Join now` for a patient.

**Expected Result:**
- UI attempts to start the call.
- Alert appears telling the clinician there is no incoming call from the patient/caregiver yet.
- Call screen closes and returns to idle state.

**Screenshot to Capture:**
- Alert message for missing incoming session.
- Suggested file: `TC07_Start_Call_No_Incoming_Request.png`

---

## TC-09
**Title:** Join existing waiting consultation session

**Preconditions:**
- Caregiver/patient side has already created a `waiting` session.
- Camera and microphone permission are allowed.

**Steps:**
1. Open Teleconsultation hub.
2. Click `Call` or `Join now` for the patient with a waiting session.

**Expected Result:**
- Full-screen video consultation modal opens.
- Initial status shows connecting/waiting text.
- Patient avatar, name, age, and diagnosis are displayed.
- Room/session indicator is visible if room ID is available.

**Screenshot to Capture:**
- Connecting state before remote stream arrives.
- Suggested file: `TC08_Connecting_State.png`

---

## TC-10
**Title:** Verify successful connected call state

**Preconditions:**
- TC-09 completed successfully.
- Remote participant stream is available.

**Steps:**
1. Wait for the remote stream to connect.
2. Observe the call header and main stage.

**Expected Result:**
- Call status changes to live/connected.
- Remote video is displayed in the main stage.
- Local preview appears in the bottom-right picture-in-picture box.
- Call duration timer starts increasing.
- Network quality/status becomes visible.

**Screenshot to Capture:**
- Active connected consultation screen.
- Suggested file: `TC09_Call_Connected.png`

---

## TC-11
**Title:** Mute and unmute microphone during consultation

**Preconditions:**
- Active video consultation is in connected state.

**Steps:**
1. Click the microphone button once.
2. Observe icon/state.
3. Click the microphone button again.

**Expected Result:**
- First click mutes audio and button changes to muted/red state.
- Second click unmutes audio and button returns to normal state.

**Screenshot to Capture:**
- Muted microphone state.
- Suggested file: `TC10_Toggle_Audio.png`

---

## TC-12
**Title:** Turn camera off and on during consultation

**Preconditions:**
- Active video consultation is in connected state.

**Steps:**
1. Click the video button once.
2. Observe local preview.
3. Click the video button again.

**Expected Result:**
- First click disables the video track.
- Local preview shows camera-off state/icon.
- Second click re-enables video.

**Screenshot to Capture:**
- Camera off state in local preview.
- Suggested file: `TC11_Toggle_Video.png`

---

## TC-13
**Title:** Open and review patient clinical summary panel during call

**Preconditions:**
- Active video consultation screen is open.

**Steps:**
1. Click the patient panel/file icon in the call header.
2. Review the right-side panel content.

**Expected Result:**
- Side panel opens successfully.
- Panel displays clinical summary data such as:
  - age
  - gender
  - risk level
  - BP
  - HR
  - latest AI analysis
  - medications if available
- `Call Notes` area is shown.

**Screenshot to Capture:**
- Patient panel with clinical summary visible.
- Suggested file: `TC12_Patient_Panel_Open.png`

---

## TC-14
**Title:** Enter call notes during consultation

**Preconditions:**
- Patient summary panel is open during an active call.

**Steps:**
1. Click inside the `Call Notes` textarea.
2. Enter consultation notes.

**Expected Result:**
- Notes are editable.
- Informational text indicates notes are saved when the call ends.

**Screenshot to Capture:**
- Notes entered in the Call Notes box.
- Suggested file: `TC13_Call_Notes_Entered.png`

---

## TC-15
**Title:** End consultation and save notes/duration

**Preconditions:**
- Active consultation is running.
- Some call notes have been entered.

**Steps:**
1. Click the `End` button.
2. Wait for the video modal to close.
3. Reopen Teleconsultation hub/history if needed.

**Expected Result:**
- Call ends successfully.
- Consultation modal closes.
- Session status is finalized as ended.
- Notes and call duration are expected to be written to the consultation session record.

**Screenshot to Capture:**
- Post-call state or returned Teleconsultation screen.

---

## TC-16
**Title:** Verify ended consultation appears in Consultation History

**Preconditions:**
- At least one consultation has ended.

**Steps:**
1. Open Teleconsultation hub.
2. Scroll to `Consultation History`.
3. Locate the recently ended consultation.

**Expected Result:**
- History table displays ended consultation.
- Row shows:
  - patient name
  - ended date/time
  - duration
  - type
  - notes
  - `Call again` action

**Screenshot to Capture:**
- Consultation history table with newly ended call.
- Suggested file: `TC14_Call_Ended_History.png`

---

## TC-17
**Title:** Verify Upcoming panel when no consultation is scheduled

**Preconditions:**
- No valid upcoming/waiting/active consultations exist.

**Steps:**
1. Open Teleconsultation hub.
2. Check the `Upcoming` panel.

**Expected Result:**
- Empty-state card is shown.
- Text similar to `Nothing scheduled` and `Click to book a consultation` is visible.

**Screenshot to Capture:**
- Upcoming empty state.

---

## TC-18
**Title:** Verify Upcoming panel with waiting or scheduled consultations

**Preconditions:**
- At least one consultation exists with `waiting`, `scheduled`, or `active` status.

**Steps:**
1. Open Teleconsultation hub.
2. Check the `Upcoming` panel.

**Expected Result:**
- Upcoming consultation cards are displayed.
- Each card shows patient avatar/name and date-time.
- `Join now` action is visible for patient-linked consultations.
- `Live` indicator appears for active consultations.

**Screenshot to Capture:**
- Upcoming consultation card list.
- Suggested file: `TC15_Upcoming_List.png`

---

## TC-19
**Title:** Verify Consultation History empty state

**Preconditions:**
- No ended or completed consultations exist for the clinician.

**Steps:**
1. Open Teleconsultation hub.
2. Navigate to `Consultation History`.

**Expected Result:**
- Empty state message is displayed.
- Message indicates no past consultations are available yet.

**Screenshot to Capture:**
- Empty history section.

---

## TC-20
**Title:** Verify camera/microphone permission denial handling

**Preconditions:**
- A waiting session exists.
- Browser camera/microphone permission is blocked or denied.

**Steps:**
1. Attempt to start/join consultation.
2. Deny browser media permission when prompted, or keep permissions blocked.

**Expected Result:**
- Error alert appears for camera/microphone access denial.
- Call returns to idle state.
- Video session should not remain active on screen.

**Screenshot to Capture:**
- Browser permission denial or resulting app alert.

---

## TC-21
**Title:** Verify room identifier is visible/copiable during consultation

**Preconditions:**
- Active or connecting consultation screen is open.
- Room ID is available for the session.

**Steps:**
1. Observe the top-right call header area.
2. Click the room badge.

**Expected Result:**
- Room identifier is visible.
- Click action copies the room value to clipboard.
- Temporary copied state is shown.

**Screenshot to Capture:**
- Room badge in call header.

---

## TC-22
**Title:** Verify Call Again action from consultation history

**Preconditions:**
- At least one record exists in Consultation History.
- Related patient still exists in clinician patient list.

**Steps:**
1. Open `Consultation History`.
2. Click `Call again` on any row.

**Expected Result:**
- System attempts to start a new call for that patient.
- If no waiting session exists, the no-incoming-call alert should appear.
- If a waiting session exists, the clinician joins the call flow.

**Screenshot to Capture:**
- Call Again action from history table.
- Suggested file: `TC16_History_List.png`

---

## Extra Evidence You Can Attach
- Teleconsultation dashboard summary cards
- Patient list with search applied
- Risk filter chip selection
- Schedule modal filled with data
- Success alert after scheduling
- Alert when no incoming call exists
- Connecting call screen
- Connected call screen
- Audio/video toggle state
- Clinical summary panel
- Call notes entered
- Consultation history row after ending call

## Notes for Report Writing
- Mention that teleconsultation is clinician-driven from the dashboard UI.
- Mention that live call connection depends on a waiting consultation session from the caregiver/patient side.
- Mention that call notes are saved when the call ends.
- Mention that the current scheduling modal shows a success alert in UI, but persistence should be separately verified if this is required for production acceptance.
