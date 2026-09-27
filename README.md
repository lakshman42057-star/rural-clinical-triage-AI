# Rural Clinical Triage AI

An expert, resilient Clinical Triage AI Assistant engineered for underfunded rural healthcare clinics and Community Health Workers (CHWs) in low-resource regions.

The application ingests unstructured patient intake notes or transcribed spoken symptoms in localized vernaculars, translates colloquial illness idioms into standardized medical concepts, extracts key vitals, computes physiological risk tiers (**CRITICAL**, **URGENT**, **NON-URGENT**), and flags immediate actionable red-flag warnings for rural clinic nurses.

---

## 🛡️ 1. Agentic Threat Model & Countermeasures (The 5 Threat Zones)

| Threat Zone | Identified Attack Vector / Risk | Enforced Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Untrusted intake notes, malicious audio transcripts, indirect prompt injection (OWASP LLM01). | Strict top-level 2MB body parser limits, defensive null-safe destructuring, plain-data isolation without dynamic execution. |
| **2. Planning & Reasoning** | System prompt bypass, hallucinated medical dosages, misclassification of emergency shock states. | Strict JSON schema constraint (`responseSchema`), system instruction bounding, hardcoded physiological safety triggers ($SpO_2 < 90\%$ or $SBP < 80\text{ mmHg}$ forces `CRITICAL`). |
| **3. Tool Execution** | Privilege escalation via API functions, SSRF, dynamic code evaluation. | Zero dynamic `eval()` execution; strictly bounded and authenticated server endpoints with parameterized payload passing. |
| **4. Memory & State** | Cross-patient record leakage, state persistence corruption, undefined crashes. | Strict undefined-stripping prior to state persistence, local owner-isolated records, clinical override audit logging. |
| **5. Inter-System Communication** | Gemini API key exposure in browser, upstream API downtime. | Server-side-only `@google/genai` SDK execution, resilient model fallback ladder (`gemini-3.6-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.7-flash`). |

---

## 🩺 2. Clinical Triage Capabilities

1. **Vernacular Translation Engine**: Automatically maps colloquial, localized phrases (e.g., *"bones breaking with fire fever"*, *"baby floppy with sunken eyes"*, *"locked jaw after nail prick"*) into formal clinical concepts (e.g., *Dengue triad arthralgia*, *Severe pediatric hypovolemic dehydration*, *Clostridium tetani trismus*).
2. **Standardized Urgency Stratification**:
   - 🔴 **CRITICAL**: Immediate resuscitation / emergency district hospital transfer.
   - 🟡 **URGENT**: High risk, rapid clinical evaluation ($\le 30$ minutes) and active clinic stabilization.
   - 🟢 **NON-URGENT**: Stable, mild symptoms for routine primary dispensary outpatient care.
3. **Nurse Actionable Red Flags**: Highlights 1–3 immediate high-priority alerts with first-line stabilization directives.
4. **Emergency Referral Slip**: Generates printable district hospital transfer slips with vital trends, intake transcripts, and referring officer sign-offs.
5. **Human-In-The-Loop Nurse Override**: Allows clinical staff to override AI triage classifications with mandatory clinical rationale logging.

---

## 🚀 3. Google Cloud Run Deployment & Configuration Guide

### Prerequisites
1. Install and initialize the **Google Cloud SDK** (`gcloud`).
2. Set your Google Cloud Project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable necessary Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com
   ```

---

### Secret Management Setup

Create the `GEMINI_API_KEY` secret in Google Cloud Secret Manager and grant access to the Cloud Run default compute service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Secret Manager Accessor role to the Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Cloud Firestore Security Configuration

Deploy owner-bound security rules to ensure patient interaction isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound patient interaction isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Clinic triage records collection
    match /clinics/{clinicId}/triageRecords/{recordId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### Cloud Run Deployment Command

Build and deploy the application to Cloud Run with Secret Manager environment injection:

```bash
gcloud run deploy rural-clinical-triage-ai \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

---

### Mandatory Campaign Verification Binding

Apply the official challenge verification label to register your service for automated evaluation:

```bash
gcloud run services update rural-clinical-triage-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 🧪 4. End-to-End Functional Test Walkthrough

The following step-by-step test script covers every user interaction and edge case:

### Test Case 1: Load Critical Case (Severe Dengue with Hemorrhagic Shock)
1. In the **Intake Station**, click the preset button **"Severe Dengue with Hemorrhagic Shock Signs"**.
2. Verify that the intake notes, vital fields (HR: 132, BP: 78/48, SpO2: 91%), and clinic region auto-fill.
3. Click **"Generate Triage Record"**.
4. **Expected Outcome**:
   - The triage tier is marked as 🔴 **CRITICAL**.
   - Red flag warning displays: *"Risk of Dengue Hemorrhagic Shock - Immediately start IV Ringer's Lactate / Oral Rehydration Solution & monitor hematocrit"*.
   - Chief complaints table maps *"bones breaking with fire fever"* ➔ *Severe Arthralgia / Dengue triad*.
   - Audio alert chime triggers.

### Test Case 2: Load Urgent Pediatric Case (Pyrexia & Severe Dehydration)
1. Click **"Pediatric High Pyrexia with Dehydration"**.
2. Click **"Generate Triage Record"**.
3. **Expected Outcome**:
   - Triage tier is marked as 🟡 **URGENT**.
   - Red flag warning flags pediatric dehydration and hyperpyrexia ($39.6^\circ\text{C}$).
   - Nurse checklist shows rehydration and rapid malaria diagnostic testing (RDT).

### Test Case 3: Load Non-Urgent Outpatient Case (Mild Coryza)
1. Click **"Mild Upper Respiratory Viral Infection"**.
2. Click **"Generate Triage Record"**.
3. **Expected Outcome**:
   - Triage tier is marked as 🟢 **NON-URGENT**.
   - Disposition advises routine outpatient primary care dispensary.

### Test Case 4: Nurse Urgency Override & Clinical Audit Logging
1. On any active triage card, click **"Override Tier"**.
2. Select **"CRITICAL"** or **"URGENT"**, enter clinical rationale: *"Patient is deteriorating rapidly with mottled extremities"*.
3. Click **"Confirm Override"**.
4. **Expected Outcome**: Card displays purple **"Nurse Override"** badge and reflects the new urgency tier.

### Test Case 5: District Hospital Referral Slip Generation
1. On the active triage card, click **"Referral Slip"**.
2. **Expected Outcome**: Modal opens with a printable formal emergency transfer slip with vitals, red flags, vernacular quotes, and clinician signature blocks.
3. Click **"Print Slip"** to verify browser print dialog rendering.

### Test Case 6: Vernacular Medical Glossary & AI Linguist
1. Click **"Vernacular Glossary"** in the top navigation.
2. In the AI Vernacular Concept Translator, type: *"fire running in belly and spinning head"*.
3. Click **"Translate"**.
4. **Expected Outcome**: The tool returns the standardized medical concept, differential causes, and follow-up triage questions.

### Test Case 7: Registry & Queue Management Export
1. In the **Triage Registry & Queue Management** section, test filtering by status and tier.
2. Click **"Export Registry (.json)"**.
3. **Expected Outcome**: Standardized JSON file containing all triage records is downloaded for DHIS2 / OpenMRS integration.

### Test Case 8: Interactive Multi-Turn Clinical AI Chatbot
1. In the bottom-right corner of the application, locate the **"Clinical AI Chat"** floating trigger with the robot logo and pulsing status indicator.
2. Click the trigger button to expand the small chat tab / window.
3. Click a suggested inquiry pill (e.g. *"How do I assess signs of pediatric septic shock?"*) or type a custom question (e.g. *"What are the emergency triage protocols for snakebite envenomation in remote villages?"*).
4. Press **Enter** or click the send button.
5. **Expected Outcome**:
   - The message is added to the scrollable multi-turn conversation thread.
   - The typing indicator displays while the request executes via the server-side Gemini fallback ladder.
   - The AI assistant returns structured clinical decision-support with danger flags (⚠️) and recommended field nursing steps.
   - Test the copy button to verify message clipboard copying.
   - Click the window expand/collapse toggle to test tab resizing, and click the close button to minimize back to the floating logo badge.

---

## 📄 License
Apache-2.0. Built for low-resource healthcare clinics and humanitarian clinical decision support.
