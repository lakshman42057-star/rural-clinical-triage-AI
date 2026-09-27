/**
 * Clinical Triage AI Assistant - Type Definitions
 * Designed for low-resource rural clinics and Community Health Workers (CHWs)
 */

export type TriageUrgencyLevel = 'CRITICAL' | 'URGENT' | 'NON-URGENT';

export type TriageStatus = 'waiting' | 'in-consult' | 'referred' | 'discharged';

export type AppPage = 'intake' | 'evaluation' | 'queue';

export interface PatientDemographics {
  name?: string;
  age?: number;
  ageUnit?: 'years' | 'months' | 'days';
  gender?: 'Male' | 'Female' | 'Other' | 'Unknown';
  isPregnant?: boolean;
  trimester?: number;
  preExistingConditions: string[];
  allergies: string[];
}

export interface VitalSigns {
  heartRateBpm?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  respiratoryRate?: number | null;
  temperatureC?: number | null;
  temperatureF?: number | null;
  oxygenSaturationSpO2?: number | null;
  bloodGlucoseMgDl?: number | null;
  abnormalFlags: string[];
}

export interface ChiefComplaint {
  vernacularPhrase: string;
  standardizedMedicalConcept: string;
  duration?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
}

export interface SymptomDetail {
  symptom: string;
  vernacularOrigin?: string;
  onsetDuration?: string;
  progression?: 'improving' | 'stable' | 'worsening' | 'rapidly deteriorating';
}

export interface TriageRecord {
  id: string;
  timestamp: string;
  clinicId?: string;
  rawIntakeNotes: string;
  patient: PatientDemographics;
  chiefComplaints: ChiefComplaint[];
  symptoms: SymptomDetail[];
  vitals: VitalSigns;
  urgencyLevel: TriageUrgencyLevel;
  urgencyReasoning: string;
  redFlagWarnings: string[];
  recommendedFirstLineActions: string[];
  differentialConsiderations: string[];
  nurseChecklist: string[];
  dispositionRecommendation: string;
  status: TriageStatus;
  nurseNotes?: string;
  manualUrgencyOverride?: TriageUrgencyLevel;
  overrideReason?: string;
  modelUsed?: string;
}

export interface TriageAnalyzeRequest {
  intakeText: string;
  clinicContext?: {
    clinicName?: string;
    region?: string;
    nurseName?: string;
  };
  manualVitals?: Partial<VitalSigns>;
}

export interface TriageAnalyzeResponse {
  success: boolean;
  record?: TriageRecord;
  error?: string;
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

