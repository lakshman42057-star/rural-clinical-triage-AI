import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ChevronRight,
  User,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Languages,
  ListTodo,
  FileCode,
  ArrowRightLeft,
  Stethoscope,
  Share2,
} from 'lucide-react';
import { TriageRecord, TriageUrgencyLevel } from '../types';

interface TriageResultCardProps {
  record: TriageRecord;
  onUpdateStatus: (id: string, newStatus: any) => void;
  onOverrideUrgency: (id: string, newUrgency: TriageUrgencyLevel, reason: string) => void;
  onOpenReferralSlip: (record: TriageRecord) => void;
}

export function TriageResultCard({
  record,
  onUpdateStatus,
  onOverrideUrgency,
  onOpenReferralSlip,
}: TriageResultCardProps) {
  const [activeTab, setActiveTab] = useState<'clinical' | 'json'>('clinical');
  const [copied, setCopied] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideTier, setOverrideTier] = useState<TriageUrgencyLevel>(record.urgencyLevel);

  const effectiveUrgency = record.manualUrgencyOverride || record.urgencyLevel;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleChecklistItem = (idx: number) => {
    setChecklistState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const applyOverride = () => {
    if (!overrideReason.trim()) {
      alert('Please enter a clinical reason for manual urgency override.');
      return;
    }
    onOverrideUrgency(record.id, overrideTier, overrideReason);
    setShowOverrideInput(false);
  };

  // Visual formatting for Urgency Tier
  let tierBadge = {
    bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
    badge: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
    label: 'NON-URGENT',
    subLabel: 'Routine Primary Care / Ambulatory Observation',
    accent: 'border-l-emerald-600',
  };

  if (effectiveUrgency === 'CRITICAL') {
    tierBadge = {
      bg: 'bg-red-50/90 border-red-200 text-red-950',
      badge: 'bg-red-600 text-white animate-pulse',
      icon: AlertOctagon,
      label: 'CRITICAL',
      subLabel: 'Immediate Emergency Resuscitation / District Transfer',
      accent: 'border-l-red-600',
    };
  } else if (effectiveUrgency === 'URGENT') {
    tierBadge = {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
      badge: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      label: 'URGENT',
      subLabel: 'High Clinical Risk • Rapid Medical Evaluation (< 30m)',
      accent: 'border-l-amber-600',
    };
  }

  const TierIcon = tierBadge.icon;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 border-l-4 ${tierBadge.accent}`}>
      {/* Top Banner with Urgency Tier & Actions */}
      <div className={`p-4 md:p-5 border-b ${tierBadge.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2.5 rounded-lg ${tierBadge.badge} shadow-xs`}>
            <TierIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-800 shadow-2xs">
                TRIAGE LEVEL
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{tierBadge.label}</span>
                <span className="text-xs font-semibold opacity-75 hidden md:inline">({tierBadge.subLabel})</span>
              </h3>
              {record.manualUrgencyOverride && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Nurse Override Active
                </span>
              )}
            </div>
            <p className="text-xs mt-1 font-medium opacity-90 leading-relaxed max-w-2xl text-slate-700">
              {record.urgencyReasoning}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenReferralSlip(record)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Referral Slip</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOverrideInput(!showOverrideInput)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Override Tier</span>
          </button>
        </div>
      </div>

      {/* Manual Override Form Drawer */}
      {showOverrideInput && (
        <div className="p-4 bg-purple-50/70 border-b border-purple-200 text-xs">
          <div className="font-bold text-purple-900 mb-2">Nurse Urgency Override & Clinical Audit</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
            <label className="font-semibold text-purple-800">New Urgency Tier:</label>
            <div className="flex items-center gap-1.5">
              {(['CRITICAL', 'URGENT', 'NON-URGENT'] as TriageUrgencyLevel[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setOverrideTier(tier)}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    overrideTier === tier
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-white text-purple-900 border border-purple-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Clinical rationale for override (e.g., patient is deteriorating rapidly with mottled skin)..."
              className="flex-1 px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
            />
            <button
              type="button"
              onClick={applyOverride}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg cursor-pointer"
            >
              Confirm Override
            </button>
            <button
              type="button"
              onClick={() => setShowOverrideInput(false)}
              className="px-2 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Immediate Red Flag Alerts Banner */}
      {record.redFlagWarnings && record.redFlagWarnings.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-200 p-4">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-900 block mb-1.5">
                Immediate Actionable Red Flags for Clinic Nurses:
              </span>
              <div className="space-y-1.5">
                {record.redFlagWarnings.map((flag, idx) => (
                  <div key={idx} className="flex gap-2.5 p-2.5 bg-red-50/80 rounded-lg border-l-4 border-red-500 text-xs font-semibold text-red-950 shadow-2xs">
                    <span className="text-red-600 font-bold font-mono">0{idx + 1}</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation (Clinical Summary vs Raw JSON) */}
      <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clinical'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Standardized Clinical Triage Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Standardized JSON Record (EHR Interop)
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono pb-2">
          ID: {record.id} • {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Tab 1: Standardized Clinical Profile */}
      {activeTab === 'clinical' && (
        <div className="p-5 space-y-5">
          {/* Section 1: Patient Demographics & Profile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Patient</span>
              <span className="font-bold text-slate-900">{record.patient.name || 'Anonymous'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Age & Gender</span>
              <span className="font-semibold text-slate-800">
                {record.patient.age ? `${record.patient.age} ${record.patient.ageUnit || 'years'}` : 'Unknown Age'}, {record.patient.gender || 'Unknown'}
                {record.patient.isPregnant && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 font-bold text-[10px]">
                    Pregnant {record.patient.trimester ? `(T${record.patient.trimester})` : ''}
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Pre-Existing Conditions</span>
              <span className="font-semibold text-slate-800">
                {record.patient.preExistingConditions.length > 0
                  ? record.patient.preExistingConditions.join(', ')
                  : 'None Reported'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Allergies</span>
              <span className="font-semibold text-slate-800">
                {record.patient.allergies.length > 0
                  ? record.patient.allergies.join(', ')
                  : 'No Known Allergies'}
              </span>
            </div>
          </div>

          {/* Section 2: Vitals Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Recorded Physiological Vitals & Flags
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Heart Rate</span>
                <span className="text-base font-bold text-slate-900">
                  {record.vitals.heartRateBpm ? `${record.vitals.heartRateBpm} bpm` : 'Not Measured'}
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Blood Pressure</span>
                <span className="text-base font-bold text-slate-900">
                  {record.vitals.systolicBp && record.vitals.diastolicBp
                    ? `${record.vitals.systolicBp}/${record.vitals.diastolicBp} mmHg`
                    : 'Not Measured'}
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Body Temp</span>
                <span className={`text-base font-bold ${record.vitals.temperatureC && record.vitals.temperatureC >= 38.5 ? 'text-red-600' : 'text-slate-900'}`}>
                  {record.vitals.temperatureC
                    ? `${record.vitals.temperatureC}°C / ${record.vitals.temperatureF}°F`
                    : 'Not Measured'}
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">SpO2 Oxygen</span>
                <span className={`text-base font-bold ${record.vitals.oxygenSaturationSpO2 && record.vitals.oxygenSaturationSpO2 < 94 ? 'text-red-600' : 'text-slate-900'}`}>
                  {record.vitals.oxygenSaturationSpO2 ? `${record.vitals.oxygenSaturationSpO2}%` : 'Not Measured'}
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Resp Rate</span>
                <span className="text-base font-bold text-slate-900">
                  {record.vitals.respiratoryRate ? `${record.vitals.respiratoryRate} /min` : 'Not Measured'}
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Blood Glucose</span>
                <span className="text-base font-bold text-slate-900">
                  {record.vitals.bloodGlucoseMgDl ? `${record.vitals.bloodGlucoseMgDl} mg/dL` : 'Not Measured'}
                </span>
              </div>
            </div>

            {/* Abnormal Flags */}
            {record.vitals.abnormalFlags && record.vitals.abnormalFlags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {record.vitals.abnormalFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200"
                  >
                    ⚠️ {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Vernacular to Standardized Clinical Translation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              Vernacular Symptom Translation to Standardized Medical Concepts
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3.5">Original Spoken / Local Description</th>
                    <th className="py-2.5 px-3.5">Standardized Medical Concept</th>
                    <th className="py-2.5 px-3.5">Duration</th>
                    <th className="py-2.5 px-3.5">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.chiefComplaints && record.chiefComplaints.length > 0 ? (
                    record.chiefComplaints.map((cc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3.5 text-slate-700 font-medium italic">
                          "{cc.vernacularPhrase}"
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-blue-900">
                          {cc.standardizedMedicalConcept}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">{cc.duration || 'Not specified'}</td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              cc.severity === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : cc.severity === 'Severe'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {cc.severity || 'Moderate'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-slate-400 text-center">
                        No individual chief complaint breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Nurse Rapid Assessment Checklist & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist */}
            <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                Nurse Rapid Assessment Checklist
              </h4>
              <div className="space-y-2">
                {record.nurseChecklist && record.nurseChecklist.length > 0 ? (
                  record.nurseChecklist.map((task, idx) => (
                    <label
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer select-none p-1.5 rounded hover:bg-blue-100/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checklistState[idx])}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className={checklistState[idx] ? 'line-through text-slate-400 font-normal' : 'font-medium'}>
                        {task}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Perform standard physical examination.</p>
                )}
              </div>
            </div>

            {/* Differential Considerations & Disposition */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Differential Considerations (Rural Outpost)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {record.differentialConsiderations && record.differentialConsiderations.length > 0 ? (
                    record.differentialConsiderations.map((diff, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        {diff}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None specified</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Disposition Recommendation
                </h4>
                <p className="text-xs font-bold text-blue-950 bg-blue-50 border border-blue-200 rounded-lg p-2.5 shadow-2xs">
                  📍 {record.dispositionRecommendation}
                </p>
              </div>

              {record.recommendedFirstLineActions && record.recommendedFirstLineActions.length > 0 && (
                <div className="border-t border-slate-200 pt-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    First-Line Interventions Available
                  </h4>
                  <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                    {record.recommendedFirstLineActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Standardized JSON Record */}
      {activeTab === 'json' && (
        <div className="p-5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>STANDARDIZED JSON RECORD (EHR INTEROP)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-2 leading-relaxed whitespace-pre-wrap text-slate-300 font-mono text-[11px]">
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
