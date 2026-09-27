export interface SampleCase {
  id: string;
  title: string;
  category: 'Critical' | 'Urgent' | 'Non-Urgent';
  locationContext: string;
  notes: string;
  vitals?: {
    heartRateBpm?: number;
    systolicBp?: number;
    diastolicBp?: number;
    temperatureC?: number;
    oxygenSaturationSpO2?: number;
    respiratoryRate?: number;
    bloodGlucoseMgDl?: number;
  };
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'case-1-dengue-critical',
    title: 'Severe Dengue with Hemorrhagic Shock Signs',
    category: 'Critical',
    locationContext: 'Rural Sub-District Health Post, Monsoon Season',
    notes: '19-year-old male farmer brought by family on cart. Complains of "bones breaking with fire fever" for 4 days, but today fever suddenly dropped and he became cold, sweaty, and dizzy. Has "dark red spots all over arms" and "bleeding from gums when spitting". Vomited dark brownish fluid twice this morning. Mother says he has not passed urine since yesterday. Pulse feels very rapid and weak like thread.',
    vitals: {
      heartRateBpm: 132,
      systolicBp: 78,
      diastolicBp: 48,
      temperatureC: 36.2,
      oxygenSaturationSpO2: 91,
      respiratoryRate: 28,
    },
  },
  {
    id: 'case-2-postpartum-critical',
    title: 'Post-Partum Hemorrhage & Maternal Shock',
    category: 'Critical',
    locationContext: 'Community Birthing Hut / Primary Health Subcenter',
    notes: '24yo G2P2 female delivered a healthy infant at home 3 hours ago with traditional birth attendant. Arrived on stretcher pale, cold extremities, confused and difficult to rouse. Clothes soaked with continuous bright red blood. Family states placenta took over an hour to deliver. Nurse palpates soft, boggy fundus above umbilicus.',
    vitals: {
      heartRateBpm: 140,
      systolicBp: 70,
      diastolicBp: 40,
      temperatureC: 35.8,
      oxygenSaturationSpO2: 88,
      respiratoryRate: 32,
    },
  },
  {
    id: 'case-3-child-fever-urgent',
    title: 'Pediatric High Pyrexia with Dehydration (Suspected Malaria)',
    category: 'Urgent',
    locationContext: 'Remote Jungle Dispensary',
    notes: '3-year-old female brought by mother. "Baby body burning hot like stove since 3 nights", shaking with cold in evenings, refuses mother\'s milk and water, vomited everything given today. Mother says child is "very floppy and crying weakly without tears". Eyes look sunken, skin pinch on abdomen goes back very slowly (>2 seconds).',
    vitals: {
      heartRateBpm: 148,
      temperatureC: 39.6,
      respiratoryRate: 44,
      oxygenSaturationSpO2: 95,
    },
  },
  {
    id: 'case-4-puncture-urgent',
    title: 'Contaminated Puncture Wound & Early Tetanus Concern',
    category: 'Urgent',
    locationContext: 'Agricultural Outpost Clinic',
    notes: '48-year-old male agricultural worker stepped on a rusty nail submerged in muddy animal manure 5 days ago. Wound on sole of right foot is swollen, throbbing, foul-smelling, and draining pus with surrounding red streaks. Patient reports "jaw feels tight like locked gate when chewing breakfast" and neck feels stiff. No tetanus vaccination history.',
    vitals: {
      heartRateBpm: 98,
      systolicBp: 145,
      diastolicBp: 90,
      temperatureC: 38.4,
      oxygenSaturationSpO2: 98,
      respiratoryRate: 18,
    },
  },
  {
    id: 'case-5-coryza-non-urgent',
    title: 'Mild Upper Respiratory Viral Infection',
    category: 'Non-Urgent',
    locationContext: 'Village Primary Health Dispensary',
    notes: '26-year-old female schoolteacher presenting with "itchy water running from nose and scratchy throat" for 2 days. Mild dry cough, no breathing difficulty, no chest tightness. Eating and drinking well, fully alert. No chronic medical conditions, no known drug allergies.',
    vitals: {
      heartRateBpm: 74,
      systolicBp: 118,
      diastolicBp: 76,
      temperatureC: 36.8,
      oxygenSaturationSpO2: 99,
      respiratoryRate: 15,
    },
  },
  {
    id: 'case-6-tinea-non-urgent',
    title: 'Localized Superficial Fungal Rash (Tinea Corporis)',
    category: 'Non-Urgent',
    locationContext: 'Rural Mobile Health Unit',
    notes: '34-year-old farmer presenting with circular, red, scaly, itchy ring-like patch on left forearm for 10 days. Reports "creeping ring itch after working in wet paddy field". No fever, no open sores, no joint pains, completely stable vital signs. Requesting ointment.',
    vitals: {
      heartRateBpm: 70,
      systolicBp: 122,
      diastolicBp: 80,
      temperatureC: 36.6,
      oxygenSaturationSpO2: 99,
      respiratoryRate: 14,
    },
  },
];
