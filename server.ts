import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization & Middleware Setup
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Lazy/safe Gemini Client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder ordered by availability and latency per Production Directives
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

// Error Recovery Matrix helper to check recoverable status codes
function isRecoverableError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || err?.statusCode || '';
  const message = (err?.message || '').toLowerCase();
  
  if (
    status === 503 ||
    status === 429 ||
    status === 404 ||
    status === 500 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'NOT_FOUND' ||
    status === 'INTERNAL' ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('unavailable') ||
    message.includes('demand') ||
    message.includes('overloaded') ||
    message.includes('rate limit') ||
    message.includes('quota')
  ) {
    return true;
  }
  return true; // Default to trying next model on any generation failure
}

async function generateContentWithFallback(
  prompt: string,
  systemInstruction: string,
  schema?: any
): Promise<FallbackResult> {
  const client = getGeminiClient();
  let lastError: any = null;

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const modelName = MODEL_FALLBACK_LADDER[i];
    try {
      const config: any = {
        systemInstruction,
        temperature: 0.1, // low temperature for precise, standardized clinical triage
      };

      if (schema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = schema;
      }

      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} encountered error in fallback ladder:`, err?.message || err);
      lastError = err;

      if (isRecoverableError(err) && i < MODEL_FALLBACK_LADDER.length - 1) {
        // Short pause to allow transient spikes to clear
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || lastError}`);
}

const generateWithFallback = generateContentWithFallback;

// Structured Clinical Triage JSON Schema
const triageSchema = {
  type: Type.OBJECT,
  properties: {
    patient: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Patient name if stated, or "Anonymous"' },
        age: { type: Type.NUMBER, description: 'Estimated or stated age in years/months' },
        ageUnit: { type: Type.STRING, description: '"years", "months", or "days"' },
        gender: { type: Type.STRING, description: '"Male", "Female", "Other", or "Unknown"' },
        isPregnant: { type: Type.BOOLEAN, description: 'Whether female patient is pregnant or post-partum' },
        trimester: { type: Type.INTEGER, description: 'Trimester (1, 2, 3) if known or 0' },
        preExistingConditions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Underlying chronic conditions (e.g., Hypertension, Diabetes, Asthma, TB, Sickle Cell, Malnutrition)',
        },
        allergies: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Reported drug or environmental allergies',
        },
      },
      required: ['preExistingConditions', 'allergies'],
    },
    chiefComplaints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          vernacularPhrase: { type: Type.STRING, description: 'Exact local/informal/spoken symptom phrase' },
          standardizedMedicalConcept: { type: Type.STRING, description: 'Standard clinical term (e.g., Epigastric burning, Severe Arthralgia, Hemoptysis)' },
          duration: { type: Type.STRING, description: 'Duration of this complaint' },
          severity: { type: Type.STRING, description: '"Mild", "Moderate", "Severe", or "Critical"' },
        },
        required: ['vernacularPhrase', 'standardizedMedicalConcept'],
      },
    },
    symptoms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symptom: { type: Type.STRING, description: 'Standardized clinical symptom' },
          vernacularOrigin: { type: Type.STRING, description: 'Original local phrase' },
          onsetDuration: { type: Type.STRING, description: 'When it started and how long' },
          progression: { type: Type.STRING, description: '"improving", "stable", "worsening", or "rapidly deteriorating"' },
        },
        required: ['symptom'],
      },
    },
    vitals: {
      type: Type.OBJECT,
      properties: {
        heartRateBpm: { type: Type.NUMBER, description: 'Heart rate in beats per minute, or null' },
        systolicBp: { type: Type.NUMBER, description: 'Systolic blood pressure mmHg, or null' },
        diastolicBp: { type: Type.NUMBER, description: 'Diastolic blood pressure mmHg, or null' },
        respiratoryRate: { type: Type.NUMBER, description: 'Breaths per minute, or null' },
        temperatureC: { type: Type.NUMBER, description: 'Body temp in Celsius, or null' },
        temperatureF: { type: Type.NUMBER, description: 'Body temp in Fahrenheit, or null' },
        oxygenSaturationSpO2: { type: Type.NUMBER, description: 'Oxygen saturation SpO2 %, or null' },
        bloodGlucoseMgDl: { type: Type.NUMBER, description: 'Blood sugar in mg/dL, or null' },
        abnormalFlags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Any flagged abnormal vitals (e.g., High Pyrexia >38.5C, Hypoxia <92%, Severe Tachycardia >120, Hypotension)',
        },
      },
      required: ['abnormalFlags'],
    },
    urgencyLevel: {
      type: Type.STRING,
      description: 'MUST BE ONE OF: "CRITICAL", "URGENT", "NON-URGENT"',
    },
    urgencyReasoning: {
      type: Type.STRING,
      description: 'Clear, concise clinical rationale for assigning this triage tier based on vitals, red flags, and patient vulnerability.',
    },
    redFlagWarnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1 to 3 immediate, high-priority actionable warnings for local clinic nurses to intervene or escalate.',
    },
    recommendedFirstLineActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Concrete first-line clinical stabilization steps available in low-resource clinics (e.g., Start Oral Rehydration / IV Ringer Lactate, Airway positioning, Administer Paracetamol, Rapid Malaria Diagnostic Test RDT).',
    },
    differentialConsiderations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Top 3-5 possible clinical conditions relevant to low-resource rural epidemiology (e.g., Falciparum Malaria, Dengue Fever, Bacterial Pneumonia, Acute Gastroenteritis with Dehydration, Preeclampsia).',
    },
    nurseChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Checklist of immediate physical assessments for the triage nurse (e.g., Check capillary refill time, Test skin turgor, Auscultate lung bases, Check for petechiae/bleeding signs).',
    },
    dispositionRecommendation: {
      type: Type.STRING,
      description: 'Immediate disposition advice: "Immediate Emergency Transfer to District Hospital", "Urgent Clinical Evaluation & In-Clinic Stabilization", or "Routine Outpatient Care & Safe Discharge Advice".',
    },
  },
  required: [
    'patient',
    'chiefComplaints',
    'symptoms',
    'vitals',
    'urgencyLevel',
    'urgencyReasoning',
    'redFlagWarnings',
    'recommendedFirstLineActions',
    'differentialConsiderations',
    'nurseChecklist',
    'dispositionRecommendation',
  ],
};

const CLINICAL_SYSTEM_INSTRUCTION = `You are an expert Clinical Triage AI Assistant designed for underfunded rural healthcare clinics in low-resource regions.
Your primary objective is to analyze unstructured patient intake notes, nurse observations, or transcribed spoken symptoms in informal, localized, or vernacular dialects.

### Core Guidelines & Rules:
1. Empathy & Precision: Accurately translate localized, colloquial, or vernacular descriptions into standardized medical concepts (e.g. "burning stomach" -> Epigastric distress / Gastritis; "head very heavy like rock" -> Severe Cephalea / Tension headache; "shivering with intense cold since yesterday" -> Rigors with Pyrexia / Malarial paroxysm; "fire in chest" -> Retrosternal burning / Angina / Reflux; "red dots on skin and bleeding gums" -> Petechiae / Mucosal bleeding / Dengue warning signs).
2. Standardized Medical Extraction: Extract age, gender, pregnancy status, pre-existing conditions, reported duration, and recorded vitals. If Fahrenheit or Celsius is given, calculate both. Flag any vital outside safe physiological thresholds.
3. Strict Triage Risk Assessment:
   - CRITICAL: Life-threatening emergencies requiring immediate resuscitation or district hospital transfer (e.g., acute chest pain with diaphoresis, severe respiratory distress/hypoxia SpO2 < 90%, altered mental state/unresponsiveness, signs of shock/hypotension, severe post-partum hemorrhage, severe acute malnutrition with lethargy, active convulsions).
   - URGENT: High-risk conditions requiring rapid medical evaluation (< 30 minutes) and active stabilization (e.g., fever > 3 days in child under 5, severe dehydration with sunken eyes, acute severe abdominal tenderness, deep laceration/animal bite, high pyrexia > 39°C, hypertensive urgency, suspected dengue with warning signs).
   - NON-URGENT: Mild, stable symptoms suitable for routine outpatient primary care (e.g., mild coryza/common cold, minor superficial rash, stable chronic medication refill, mild tension headache).
4. Red Flag Warnings: Provide 1-3 immediate, actionable clinical red flags tailored for rural clinic nurses/CHWs.
5. Feasible First-Line Interventions: Recommend realistic low-resource clinic interventions (e.g., Oral Rehydration Salts (ORS), rapid diagnostic testing (RDT), IV access, oxygen administration, lateral safety positioning).`;

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Rural Clinical Triage AI', timestamp: new Date().toISOString() });
});

// Main Triage Analysis Endpoint
app.post('/api/triage/analyze', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const intakeText = typeof body.intakeText === 'string' ? body.intakeText.trim() : '';
    const manualVitals = (body.manualVitals && typeof body.manualVitals === 'object') ? body.manualVitals : {};
    const clinicContext = (body.clinicContext && typeof body.clinicContext === 'object') ? body.clinicContext : {};

    if (!intakeText || intakeText.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please provide patient intake notes or spoken symptom transcript for triage analysis.',
      });
    }

    // Prepare prompt with optional manual vitals
    let promptText = `Analyze the following rural clinic patient intake notes and produce a standardized clinical triage record:\n\n${intakeText}`;

    const vitalsParts: string[] = [];
    if (manualVitals.heartRateBpm) vitalsParts.push(`Heart Rate: ${manualVitals.heartRateBpm} bpm`);
    if (manualVitals.systolicBp && manualVitals.diastolicBp) vitalsParts.push(`BP: ${manualVitals.systolicBp}/${manualVitals.diastolicBp} mmHg`);
    if (manualVitals.temperatureC) vitalsParts.push(`Temperature: ${manualVitals.temperatureC} °C`);
    if (manualVitals.temperatureF) vitalsParts.push(`Temperature: ${manualVitals.temperatureF} °F`);
    if (manualVitals.oxygenSaturationSpO2) vitalsParts.push(`SpO2: ${manualVitals.oxygenSaturationSpO2} %`);
    if (manualVitals.respiratoryRate) vitalsParts.push(`Respiratory Rate: ${manualVitals.respiratoryRate} /min`);
    if (manualVitals.bloodGlucoseMgDl) vitalsParts.push(`Blood Glucose: ${manualVitals.bloodGlucoseMgDl} mg/dL`);

    if (vitalsParts.length > 0) {
      promptText += `\n\nExplicit Measured Vitals:\n${vitalsParts.join(', ')}`;
    }

    if (clinicContext.region || clinicContext.clinicName) {
      promptText += `\n\nClinic Setting: ${clinicContext.clinicName || 'Rural Primary Care Center'}, Region: ${clinicContext.region || 'Low-Resource Setting'}`;
    }

    const { text, modelUsed } = await generateWithFallback(
      promptText,
      CLINICAL_SYSTEM_INSTRUCTION,
      triageSchema
    );

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(text);
    } catch (parseErr) {
      // Fallback regex extraction if raw json formatting was wrapped
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON triage record from AI response.');
      }
    }

    // Normalize urgency level
    let urgencyLevel = parsedResult.urgencyLevel?.toUpperCase()?.trim() || 'URGENT';
    if (!['CRITICAL', 'URGENT', 'NON-URGENT'].includes(urgencyLevel)) {
      if (urgencyLevel.includes('CRIT') || urgencyLevel.includes('EMERG')) urgencyLevel = 'CRITICAL';
      else if (urgencyLevel.includes('NON') || urgencyLevel.includes('ROUTINE') || urgencyLevel.includes('MILD')) urgencyLevel = 'NON-URGENT';
      else urgencyLevel = 'URGENT';
    }

    // Merge manual vitals if parsed vitals are empty
    const finalVitals = {
      heartRateBpm: parsedResult.vitals?.heartRateBpm ?? manualVitals.heartRateBpm ?? null,
      systolicBp: parsedResult.vitals?.systolicBp ?? manualVitals.systolicBp ?? null,
      diastolicBp: parsedResult.vitals?.diastolicBp ?? manualVitals.diastolicBp ?? null,
      respiratoryRate: parsedResult.vitals?.respiratoryRate ?? manualVitals.respiratoryRate ?? null,
      temperatureC: parsedResult.vitals?.temperatureC ?? manualVitals.temperatureC ?? null,
      temperatureF: parsedResult.vitals?.temperatureF ?? manualVitals.temperatureF ?? null,
      oxygenSaturationSpO2: parsedResult.vitals?.oxygenSaturationSpO2 ?? manualVitals.oxygenSaturationSpO2 ?? null,
      bloodGlucoseMgDl: parsedResult.vitals?.bloodGlucoseMgDl ?? manualVitals.bloodGlucoseMgDl ?? null,
      abnormalFlags: Array.isArray(parsedResult.vitals?.abnormalFlags) ? parsedResult.vitals.abnormalFlags : [],
    };

    // Calculate temperature conversion if one is missing
    if (finalVitals.temperatureC && !finalVitals.temperatureF) {
      finalVitals.temperatureF = Number(((finalVitals.temperatureC * 9) / 5 + 32).toFixed(1));
    } else if (finalVitals.temperatureF && !finalVitals.temperatureC) {
      finalVitals.temperatureC = Number((((finalVitals.temperatureF - 32) * 5) / 9).toFixed(1));
    }

    // Check physiological red flags directly as safety defense
    if (finalVitals.oxygenSaturationSpO2 && finalVitals.oxygenSaturationSpO2 < 90) {
      if (!finalVitals.abnormalFlags.includes('Severe Hypoxia (SpO2 < 90%)')) {
        finalVitals.abnormalFlags.push('Severe Hypoxia (SpO2 < 90%)');
      }
      urgencyLevel = 'CRITICAL';
    }
    if (finalVitals.systolicBp && finalVitals.systolicBp < 80) {
      if (!finalVitals.abnormalFlags.includes('Hypotension / Impending Shock (Systolic BP < 80 mmHg)')) {
        finalVitals.abnormalFlags.push('Hypotension / Impending Shock (Systolic BP < 80 mmHg)');
      }
      urgencyLevel = 'CRITICAL';
    }

    const record = {
      id: `TRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      clinicId: clinicContext.clinicName || 'Rural Clinic Primary Station',
      rawIntakeNotes: intakeText,
      patient: {
        name: parsedResult.patient?.name || 'Anonymous Patient',
        age: parsedResult.patient?.age || undefined,
        ageUnit: parsedResult.patient?.ageUnit || 'years',
        gender: parsedResult.patient?.gender || 'Unknown',
        isPregnant: Boolean(parsedResult.patient?.isPregnant),
        trimester: parsedResult.patient?.trimester || undefined,
        preExistingConditions: Array.isArray(parsedResult.patient?.preExistingConditions) ? parsedResult.patient.preExistingConditions : [],
        allergies: Array.isArray(parsedResult.patient?.allergies) ? parsedResult.patient.allergies : [],
      },
      chiefComplaints: Array.isArray(parsedResult.chiefComplaints) ? parsedResult.chiefComplaints : [],
      symptoms: Array.isArray(parsedResult.symptoms) ? parsedResult.symptoms : [],
      vitals: finalVitals,
      urgencyLevel,
      urgencyReasoning: parsedResult.urgencyReasoning || 'Triage urgency evaluated from clinical notes and reported vitals.',
      redFlagWarnings: Array.isArray(parsedResult.redFlagWarnings) && parsedResult.redFlagWarnings.length > 0
        ? parsedResult.redFlagWarnings
        : ['Monitor patient vital stability continuously while awaiting clinician review.'],
      recommendedFirstLineActions: Array.isArray(parsedResult.recommendedFirstLineActions) ? parsedResult.recommendedFirstLineActions : [],
      differentialConsiderations: Array.isArray(parsedResult.differentialConsiderations) ? parsedResult.differentialConsiderations : [],
      nurseChecklist: Array.isArray(parsedResult.nurseChecklist) ? parsedResult.nurseChecklist : [],
      dispositionRecommendation: parsedResult.dispositionRecommendation || (urgencyLevel === 'CRITICAL' ? 'Immediate Emergency Transfer' : 'Clinical Evaluation'),
      status: 'waiting',
      modelUsed,
    };

    return res.json({
      success: true,
      record,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Triage analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error during triage analysis.',
    });
  }
});

// Translation / Audio transcription text processing helper
app.post('/api/triage/translate-vernacular', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const phrase = typeof body.phrase === 'string' ? body.phrase.trim() : '';

    if (!phrase) {
      return res.status(400).json({ success: false, error: 'Missing vernacular phrase' });
    }

    const prompt = `Translate this localized/informal symptom description into a standardized medical concept and suggest relevant triage questions:\n"${phrase}"`;
    const systemPrompt = `You are a clinical linguist for rural health systems. Return a JSON object with:
    - standardizedConcept: string
    - clinicalDefinition: string
    - potentialCauses: string[] (top 3)
    - triageFollowUpQuestions: string[] (top 2 questions for nurse)`;

    const { text, modelUsed } = await generateWithFallback(
      prompt,
      systemPrompt,
      {
        type: Type.OBJECT,
        properties: {
          standardizedConcept: { type: Type.STRING },
          clinicalDefinition: { type: Type.STRING },
          potentialCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
          triageFollowUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['standardizedConcept', 'clinicalDefinition', 'potentialCauses', 'triageFollowUpQuestions'],
      }
    );

    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON translation from AI response.');
      }
    }

    return res.json({
      success: true,
      data: parsedData,
      modelUsed,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Translation error' });
  }
});

// Helper for multi-turn chat generation with fallback ladder
async function generateChatWithFallback(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<FallbackResult> {
  const client = getGeminiClient();
  let lastError: any = null;

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const modelName = MODEL_FALLBACK_LADDER[i];
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`Chat model ${modelName} encountered error in fallback ladder:`, err?.message || err);
      lastError = err;

      if (isRecoverableError(err) && i < MODEL_FALLBACK_LADDER.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }
  }

  throw new Error(
    `All chat models failed in fallback ladder. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

// Multi-turn Clinical Chatbot API Route
app.post('/api/chat', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    if (rawMessages.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one message is required.' });
    }

    // Defensive mapping & sanitization of conversation history
    const contents = rawMessages
      .filter((m: any) => m && (m.content || m.text))
      .map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.content || m.text || '').slice(0, 4000) }],
      }));

    if (contents.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid message content found.' });
    }

    // Role-specific clinical system instruction
    const systemInstruction = `You are the **Clinical Triage & Field Protocol AI Copilot**, an intelligent, evidence-based decision-support assistant designed for primary care nurses, medical officers, and community health workers operating in low-resource and rural clinics.

Your clinical objectives:
1. **Symptom Clarification**: Translate vernacular phrases, regional idioms, and vague chief complaints into structured clinical terms (SNOMED/ICD equivalent concepts).
2. **Urgency Stratification**: Assist clinicians in assessing urgency tiers:
   - 🔴 **CRITICAL**: Immediate danger, unmanageable ABCs (Airway, Breathing, Circulation), septic shock, SpO2 < 90%, SBP < 80 mmHg, altered mental state, severe hemorrhage.
   - 🟡 **URGENT**: High clinical risk, severe dehydration, persistent high fever (>39°C), worsening respiratory distress, suspected ectopic pregnancy, severe abdominal rigidity.
   - 🟢 **NON-URGENT**: Stable vitals, mild chronic/subacute symptoms, routine primary care.
3. **Emergency Stabilization & First Aid**: Provide step-by-step nursing actions (e.g. lateral recovery position, oral rehydration solution, emergency oxygen titration, bag-valve mask, hypoglycemia correction).
4. **Referral Criteria**: Identify when district hospital transfer with IV access is mandatory.

Guidelines:
- Keep explanations clear, concise, and well-structured with bullet points and bold headers.
- Always highlight life-threatening danger signs with ⚠️.
- Remind users that recommendations provide triage decision-support and do not replace bedside clinical judgment.`;

    const { text, modelUsed } = await generateChatWithFallback(contents, systemInstruction);

    return res.json({
      success: true,
      reply: text,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'An error occurred while generating chat response.',
    });
  }
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rural Clinical Triage AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
