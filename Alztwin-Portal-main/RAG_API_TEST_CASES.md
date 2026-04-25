# RAG API Test Cases

## Scope
This document covers manual API test cases for the RAG-based recommendation endpoint used by the clinician-facing `Trials-backed Support` panel.

Primary areas covered:
- Successful recommendation generation
- Request body validation
- Evidence source retrieval
- Disclaimer response
- Invalid method and authorization handling
- Malformed JSON handling
- Empty, missing, and boundary input cases
- Response time and content type verification
- Backend error handling

## API Endpoint Under Test
- Method: `POST`
- Endpoint: `/api/rag/recommend?code=<function_code>`
- Content-Type: `application/json`
- Used by frontend: Digital Twin workflow, `Trials-backed Support` panel
- Local development behavior: Vite proxy forwards `/api/rag/recommend` requests to the Azure Function backend.

## Request Shape Used by Frontend
```json
{
  "age": 72,
  "patient_id": "patient_001",
  "vitals": {
    "sleep_quality": "good",
    "sleep_hours": 7,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "heart_rate_bpm": 75
  },
  "stage": "mild",
  "top_k": 3,
  "comorbidities": ["hypertension", "diabetes"],
  "current_medications": ["metformin", "donepezil"]
}
```

## Response Fields Expected by Frontend
The frontend can display these response fields:

- `patient_id`
- `stage`
- `recommendation.treatment`
- `recommendation.dosage`
- `recommendation.rationale`
- `recommendation.cautions`
- `recommendation.monitoring`
- `recommendation.lifestyle_notes`
- `sources`
- `disclaimer`

## Recommended Tools for Screenshot Evidence
- Postman
- Thunder Client
- Browser Developer Tools, Network tab
- Azure Function logs, only if needed for backend failure evidence

## Recommended Screenshot Naming
Use these screenshot names in your report:

- `RAGAPI01_Valid_Request_200.png`
- `RAGAPI02_Response_Recommendation_Fields.png`
- `RAGAPI03_Response_Evidence_Sources.png`
- `RAGAPI04_Response_Disclaimer.png`
- `RAGAPI05_Missing_Stage_Error.png`
- `RAGAPI06_Missing_Patient_ID_Error.png`
- `RAGAPI07_Missing_Vitals_Error.png`
- `RAGAPI08_Invalid_Stage_Error.png`
- `RAGAPI09_Invalid_TopK_Error.png`
- `RAGAPI10_Empty_Arrays_Response.png`
- `RAGAPI11_Malformed_JSON_Error.png`
- `RAGAPI12_Invalid_Method_Error.png`
- `RAGAPI13_Invalid_Function_Code_Error.png`
- `RAGAPI14_Response_Headers.png`
- `RAGAPI15_Response_Time.png`
- `RAGAPI16_Large_Input_Response.png`
- `RAGAPI17_Server_Error.png`
- `RAGAPI18_Frontend_Network_Request.png`

## Common Preconditions
- API server or deployed Azure Function is reachable.
- Correct function code is available for positive tests.
- Tester can send JSON requests through Postman, Thunder Client, or browser network tools.
- Request headers can be edited.
- For negative tests, tester is allowed to send invalid request bodies.

## Test Case Format
- `Test Case ID`
- `Title`
- `Preconditions`
- `Steps`
- `Expected Result`
- `Screenshot to Capture`

---

## TC-RAG-API-01
**Title:** Verify successful RAG recommendation API response

**Preconditions:**
- API endpoint is reachable.
- Valid function code is used.
- Valid JSON request body is prepared.

**Steps:**
1. Open Postman or Thunder Client.
2. Set method to `POST`.
3. Enter `/api/rag/recommend?code=<valid_function_code>` or the full deployed Azure Function URL.
4. Add header `Content-Type: application/json`.
5. Paste the valid sample request body.
6. Click `Send`.

**Expected Result:**
- API returns HTTP `200 OK`.
- Response body is valid JSON.
- Response contains patient, stage, recommendation, source, and disclaimer information.

**Screenshot to Capture:**
- Request URL, request body, HTTP 200 status, and response body.
- Suggested file: `RAGAPI01_Valid_Request_200.png`

---

## TC-RAG-API-02
**Title:** Verify recommendation object fields in successful response

**Preconditions:**
- TC-RAG-API-01 completed successfully.

**Steps:**
1. Inspect the JSON response body.
2. Expand the `recommendation` object.
3. Verify the visible recommendation fields.

**Expected Result:**
- `recommendation` object is present.
- It contains treatment guidance fields such as:
  - `treatment`
  - `dosage`
  - `rationale`
  - `cautions`
  - `monitoring`
  - `lifestyle_notes`
- Array/list values are returned in a readable JSON format when applicable.

**Screenshot to Capture:**
- Expanded `recommendation` object.
- Suggested file: `RAGAPI02_Response_Recommendation_Fields.png`

---

## TC-RAG-API-03
**Title:** Verify evidence sources are returned by API

**Preconditions:**
- Successful API response is available.
- Request uses `top_k` greater than `0`.

**Steps:**
1. Send a valid request with `"top_k": 3`.
2. Inspect the `sources` field in the response body.

**Expected Result:**
- `sources` field is present.
- Sources are returned as an array.
- Each source may show:
  - `title`
  - `source`
  - `doc_id`
  - `source_url`
  - `relevance_score`
- Number of returned sources should match or be close to the requested `top_k`, depending on backend availability.

**Screenshot to Capture:**
- `sources` array in the API response.
- Suggested file: `RAGAPI03_Response_Evidence_Sources.png`

---

## TC-RAG-API-04
**Title:** Verify disclaimer is included in API response

**Preconditions:**
- Successful API response is available.

**Steps:**
1. Send a valid RAG recommendation request.
2. Scroll to the lower part of the JSON response.
3. Locate the `disclaimer` field.

**Expected Result:**
- `disclaimer` field is present.
- Disclaimer is returned as readable text.
- Disclaimer clearly indicates that recommendations are clinical decision support and not a replacement for clinician judgment.

**Screenshot to Capture:**
- Disclaimer field in response body.
- Suggested file: `RAGAPI04_Response_Disclaimer.png`

---

## TC-RAG-API-05
**Title:** Verify validation error when `stage` field is missing

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a `POST` request with a valid body except remove the `stage` field.
2. Click `Send`.

**Expected Result:**
- API returns validation failure, such as HTTP `400 Bad Request`, or an equivalent error response.
- Error message indicates that required input is missing or invalid.
- API does not return a successful recommendation for incomplete input.

**Screenshot to Capture:**
- Error response for missing `stage`.
- Suggested file: `RAGAPI05_Missing_Stage_Error.png`

---

## TC-RAG-API-06
**Title:** Verify validation error when `patient_id` is missing or empty

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a request without `patient_id`.
2. Send another request with `"patient_id": ""`.

**Expected Result:**
- API rejects the request or returns a clearly documented validation response.
- No normal recommendation should be generated for an invalid patient identifier.

**Screenshot to Capture:**
- Error response for missing or empty patient ID.
- Suggested file: `RAGAPI06_Missing_Patient_ID_Error.png`

---

## TC-RAG-API-07
**Title:** Verify validation behavior when `vitals` object is missing

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a valid request body but remove the complete `vitals` object.
2. Click `Send`.

**Expected Result:**
- API rejects the request with validation error, or applies documented default handling if backend supports it.
- Response remains readable JSON.
- Server should not crash.

**Screenshot to Capture:**
- Response for missing `vitals` object.
- Suggested file: `RAGAPI07_Missing_Vitals_Error.png`

---

## TC-RAG-API-08
**Title:** Verify validation behavior for invalid disease stage

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a valid request body.
2. Set `"stage": "critical"` or another unsupported value.
3. Click `Send`.

**Expected Result:**
- API rejects invalid stage with a clear validation error, or normalizes it only if fallback behavior is documented.
- Response should not silently generate misleading treatment output.

**Screenshot to Capture:**
- Response for invalid stage value.
- Suggested file: `RAGAPI08_Invalid_Stage_Error.png`

---

## TC-RAG-API-09
**Title:** Verify validation behavior for invalid `top_k`

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send request with `"top_k": 0`.
2. Send request with `"top_k": -1`.
3. Send request with `"top_k": "three"`.

**Expected Result:**
- API rejects invalid `top_k` values or safely sanitizes them.
- Response should not return malformed source results.
- Error response should be readable if validation fails.

**Screenshot to Capture:**
- Invalid `top_k` request and response.
- Suggested file: `RAGAPI09_Invalid_TopK_Error.png`

---

## TC-RAG-API-10
**Title:** Verify API handles empty comorbidities and medications arrays

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a valid request with:
   - `"comorbidities": []`
   - `"current_medications": []`
2. Click `Send`.

**Expected Result:**
- API accepts the request if empty arrays are allowed.
- Recommendation is still generated, or a clear validation message is returned.
- Empty arrays should not cause a server crash.

**Screenshot to Capture:**
- Empty-array payload and response.
- Suggested file: `RAGAPI10_Empty_Arrays_Response.png`

---

## TC-RAG-API-11
**Title:** Verify API handles malformed JSON request body

**Preconditions:**
- API endpoint is reachable.
- API client allows raw request body editing.

**Steps:**
1. Set header `Content-Type: application/json`.
2. Send malformed JSON, such as a missing closing brace or comma.
3. Click `Send`.

**Expected Result:**
- API returns parsing or validation error.
- Response should be controlled and readable.
- Server should not crash.
- Production response should not expose sensitive stack trace details.

**Screenshot to Capture:**
- Malformed JSON request and error response.
- Suggested file: `RAGAPI11_Malformed_JSON_Error.png`

---

## TC-RAG-API-12
**Title:** Verify unsupported HTTP method is rejected

**Preconditions:**
- API endpoint is reachable.
- Valid function code is available.

**Steps:**
1. Change request method from `POST` to `GET`.
2. Send request to `/api/rag/recommend?code=<valid_function_code>`.

**Expected Result:**
- API rejects unsupported method.
- Expected status may be `405 Method Not Allowed`, `404 Not Found`, or another documented backend response.
- No recommendation body should be generated through `GET`.

**Screenshot to Capture:**
- GET request and error response.
- Suggested file: `RAGAPI12_Invalid_Method_Error.png`

---

## TC-RAG-API-13
**Title:** Verify invalid or missing function code is rejected

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send valid request body with an incorrect `code` value.
2. Send another request with the `code` query parameter removed.

**Expected Result:**
- API rejects unauthorized request.
- Response indicates authentication or authorization failure.
- Recommendation should not be generated without valid function code.

**Screenshot to Capture:**
- Invalid-code or missing-code error response.
- Suggested file: `RAGAPI13_Invalid_Function_Code_Error.png`

---

## TC-RAG-API-14
**Title:** Verify response content type is JSON

**Preconditions:**
- Successful API response is available.

**Steps:**
1. Send a valid RAG recommendation request.
2. Open the response headers section in Postman, Thunder Client, or browser Network tab.
3. Check `Content-Type`.

**Expected Result:**
- Response content type is JSON, such as `application/json`.
- API client can parse and display the response as JSON.

**Screenshot to Capture:**
- Response headers showing content type.
- Suggested file: `RAGAPI14_Response_Headers.png`

---

## TC-RAG-API-15
**Title:** Verify API response time for valid request

**Preconditions:**
- API endpoint is reachable.
- Network connection is stable.

**Steps:**
1. Send a valid recommendation request.
2. Observe the response time shown by the API client.
3. Repeat at least two times if needed for more reliable evidence.

**Expected Result:**
- API responds without timeout.
- Response time is acceptable for project demonstration.
- Any delay caused by retrieval or AI generation should still result in a completed controlled response.

**Screenshot to Capture:**
- API client showing response status and response time.
- Suggested file: `RAGAPI15_Response_Time.png`

---

## TC-RAG-API-16
**Title:** Verify API behavior with large clinical input lists

**Preconditions:**
- API endpoint is reachable.

**Steps:**
1. Send a request with many realistic comorbidities.
2. Send a request with many current medications.
3. Keep the rest of the request body valid.

**Expected Result:**
- API should process the request or return a controlled validation response.
- Server should not crash.
- Response should not expose internal errors.

**Screenshot to Capture:**
- Large request body and API response.
- Suggested file: `RAGAPI16_Large_Input_Response.png`

---

## TC-RAG-API-17
**Title:** Verify controlled server error handling

**Preconditions:**
- Backend failure can be simulated, or test environment can temporarily use an unavailable/misconfigured backend.

**Steps:**
1. Trigger a backend failure scenario, such as unavailable retrieval service, broken environment variable, or unavailable model service.
2. Send a valid RAG recommendation request.
3. Observe the API response.

**Expected Result:**
- API returns controlled server-side error, such as HTTP `500 Internal Server Error`, or another backend failure response.
- Error message is readable.
- Production response should not expose secrets, full stack traces, or function keys.

**Screenshot to Capture:**
- Controlled server error response.
- Suggested file: `RAGAPI17_Server_Error.png`

---

## TC-RAG-API-18
**Title:** Verify frontend sends correct API request from RAG panel

**Preconditions:**
- Clinician dashboard is running.
- RAG panel is open.
- Browser Developer Tools can be opened.

**Steps:**
1. Open browser Developer Tools.
2. Go to the `Network` tab.
3. In the RAG panel, click `Generate Support Plan`.
4. Select the `/api/rag/recommend` request in the Network tab.
5. Inspect request method, request URL, request payload, and response.

**Expected Result:**
- Frontend sends a `POST` request to `/api/rag/recommend`.
- Request payload includes patient ID, age, stage, vitals, `top_k`, comorbidities, and current medications.
- Response is received and used by the UI to render the support plan.

**Screenshot to Capture:**
- Browser Network tab showing request payload and response.
- Suggested file: `RAGAPI18_Frontend_Network_Request.png`

---

## Sample Positive Test Payload
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "vitals": {
    "sleep_quality": "fair",
    "sleep_hours": 6.5,
    "systolic_bp": 132,
    "diastolic_bp": 84,
    "heart_rate_bpm": 78
  },
  "stage": "moderate",
  "top_k": 3,
  "comorbidities": ["hypertension"],
  "current_medications": ["donepezil"]
}
```

## Sample Negative Test Payloads

### Missing `stage`
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "vitals": {
    "sleep_quality": "fair",
    "sleep_hours": 6.5,
    "systolic_bp": 132,
    "diastolic_bp": 84,
    "heart_rate_bpm": 78
  },
  "top_k": 3,
  "comorbidities": ["hypertension"],
  "current_medications": ["donepezil"]
}
```

### Missing `vitals`
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "stage": "moderate",
  "top_k": 3,
  "comorbidities": ["hypertension"],
  "current_medications": ["donepezil"]
}
```

### Invalid `stage`
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "vitals": {
    "sleep_quality": "fair",
    "sleep_hours": 6.5,
    "systolic_bp": 132,
    "diastolic_bp": 84,
    "heart_rate_bpm": 78
  },
  "stage": "critical",
  "top_k": 3,
  "comorbidities": ["hypertension"],
  "current_medications": ["donepezil"]
}
```

### Invalid `top_k`
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "vitals": {
    "sleep_quality": "fair",
    "sleep_hours": 6.5,
    "systolic_bp": 132,
    "diastolic_bp": 84,
    "heart_rate_bpm": 78
  },
  "stage": "moderate",
  "top_k": 0,
  "comorbidities": ["hypertension"],
  "current_medications": ["donepezil"]
}
```

### Empty Arrays
```json
{
  "age": 71,
  "patient_id": "PT-1001",
  "vitals": {
    "sleep_quality": "fair",
    "sleep_hours": 6.5,
    "systolic_bp": 132,
    "diastolic_bp": 84,
    "heart_rate_bpm": 78
  },
  "stage": "moderate",
  "top_k": 3,
  "comorbidities": [],
  "current_medications": []
}
```

## Extra Evidence You Can Attach
- Postman request body with successful `200 OK`
- JSON response showing recommendation object
- JSON response showing evidence sources
- JSON response showing disclaimer
- Error response for missing required field
- Error response for invalid function code
- Browser Network tab showing frontend request payload
- Response time from Postman or Thunder Client
- Response headers showing JSON content type

## Notes for Report Writing
- Mention that the RAG API powers the clinician-facing `Trials-backed Support` panel.
- Mention that the frontend sends patient demographics, vitals, disease stage, comorbidities, medications, and requested source count.
- Mention that the API returns treatment support, rationale, cautions, monitoring guidance, lifestyle notes, evidence sources, and disclaimer text.
- Mention that negative API tests verify input validation and controlled error handling.
- Mention that actual pass/fail status should be recorded based on observed backend behavior if no formal API contract is available.
