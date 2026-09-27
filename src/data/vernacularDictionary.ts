export interface VernacularTerm {
  vernacularPhrase: string;
  regionalContext: string;
  medicalConcept: string;
  clinicalSignificance: string;
  redFlagThreshold: string;
}

export const VERNACULAR_DICTIONARY: VernacularTerm[] = [
  {
    vernacularPhrase: 'Burning in chest / fire in stomach',
    regionalContext: 'Universal / South Asia / Latin America',
    medicalConcept: 'Epigastric pain / GERD / Gastritis vs. Atypical Acute Coronary Syndrome',
    clinicalSignificance: 'Often described informally. Must rule out myocardial infarction in middle-aged/elderly or patients with cardiovascular risk factors.',
    redFlagThreshold: 'Radiation to jaw/arm, diaphoresis, hypotension, or syncope.',
  },
  {
    vernacularPhrase: 'Bones breaking fever / fire inside body',
    regionalContext: 'Tropical regions / Southeast Asia / Sub-Saharan Africa',
    medicalConcept: 'Severe Arthralgia & Myalgia triad (Dengue / Chikungunya / Malaria)',
    clinicalSignificance: 'Classic description of arboviral fever. High risk of plasma leakage or shock if fever suddenly defers on Day 3-5.',
    redFlagThreshold: 'Petechiae, mucosal bleeding, persistent vomiting, severe abdominal pain, hypothermia with cold clammy skin.',
  },
  {
    vernacularPhrase: 'Shaking with ice cold & teeth chattering',
    regionalContext: 'Endemic malaria zones',
    medicalConcept: 'Rigors / Malarial Paroxysm / Severe Sepsis bacteremia',
    clinicalSignificance: 'Rapid temperature spiking caused by cytokine surges, typical of Plasmodium falciparum rupture of schizonts or pyelonephritis.',
    redFlagThreshold: 'Altered sensorium, dark coca-cola urine (blackwater fever), jaundice, convulsions.',
  },
  {
    vernacularPhrase: 'Baby floppy, eyes like hollow pit, skin not bouncing',
    regionalContext: 'Community Health Worker / Pediatric intake',
    medicalConcept: 'Severe Dehydration / Hypovolemic Shock / Sunken Fontanelle / Decreased Skin Turgor',
    clinicalSignificance: 'Loss of >10% body fluid volume in pediatric gastroenteritis. Emergency state requiring immediate rehydration.',
    redFlagThreshold: 'Skin pinch returns in >2 seconds, inability to drink or breastfeed, lethargy/coma.',
  },
  {
    vernacularPhrase: 'Locked jaw / stiff neck like wooden board',
    regionalContext: 'Rural agricultural workers without immunization',
    medicalConcept: 'Trismus (Lockjaw) / Opisthotonos / Clostridium tetani infection vs. Meningism',
    clinicalSignificance: 'Tetanospasmin toxin blocking inhibitory neurotransmitters following puncture wounds or umbilical contamination.',
    redFlagThreshold: 'Spasms triggered by light or sound, respiratory difficulty, contaminated wound history.',
  },
  {
    vernacularPhrase: 'Chest feels like snake coiled tight / heavy millstone',
    regionalContext: 'Colloquial cardiac / pulmonary descriptions',
    medicalConcept: 'Ischemic chest tightness / Angina Pectoris / Severe Bronchospasm',
    clinicalSignificance: 'Direct presentation of coronary ischemia, pulmonary embolism, or acute asthma exacerbation.',
    redFlagThreshold: 'Pain lasting >20 minutes, dyspnea at rest, oxygen saturation <92%, hypotension.',
  },
  {
    vernacularPhrase: 'Dark red tea / coca-cola urine',
    regionalContext: 'Tropical rural clinics',
    medicalConcept: 'Hemoglobinuria / Massive Hemolysis (Blackwater Fever) / Rhabdomyolysis',
    clinicalSignificance: 'Intravascular hemolysis in severe malaria, G6PD deficiency with oxidant exposure, or snakebite envenomation.',
    redFlagThreshold: 'Oliguria (no urine in 12h), jaundice, sudden severe pallor.',
  },
];
