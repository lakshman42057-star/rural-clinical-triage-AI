import { useRef } from 'react';
import { X, Printer, Ambulance, Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TriageRecord } from '../types';

interface ReferralSlipModalProps {
  record: TriageRecord | null;
  onClose: () => void;
}

export function ReferralSlipModal({ record, onClose }: ReferralSlipModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const effectiveUrgency = record.manualUrgencyOverride || record.urgencyLevel;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              District Hospital Emergency Transfer & Referral Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Referral Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div ref={slipRef} className="p-6 overflow-y-auto space-y-4 text-xs font-sans print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
            <div>
              <div className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                Rural Primary Health Care Station
              </div>
              <div className="text-slate-600 text-[11px]">
                Originating Facility: {record.clinicId || 'Sub-District Health Center'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Date & Time: {new Date(record.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-mono">REFERRAL ID</div>
              <div className="font-mono font-bold text-slate-900">{record.id}</div>
              <div
                className={`mt-1 inline-block px-2.5 py-1 rounded text-xs font-extrabold uppercase ${
                  effectiveUrgency === 'CRITICAL'
                    ? 'bg-red-600 text-white'
                    : effectiveUrgency === 'URGENT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {effectiveUrgency}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Patient Name</span>
              <span className="font-bold text-slate-900">{record.patient.name || 'Anonymous'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Age / Biological Sex</span>
              <span className="font-semibold text-slate-800">
                {record.patient.age ? `${record.patient.age}y` : 'Unknown'}, {record.patient.gender}
                {record.patient.isPregnant && ' (Pregnant)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Chronic Illness / Allergies</span>
              <span className="font-semibold text-slate-800">
                {record.patient.preExistingConditions.length > 0
                  ? record.patient.preExistingConditions.join(', ')
                  : 'None noted'}
              </span>
            </div>
          </div>

          {/* Recorded Vitals at Presentation */}
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="font-bold text-slate-900 text-xs mb-1.5 uppercase tracking-wider">
              Recorded Vital Signs at Primary Presentation
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">HR</span>
                <span className="font-bold text-slate-900">{record.vitals.heartRateBpm ? `${record.vitals.heartRateBpm} bpm` : 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">BP</span>
                <span className="font-bold text-slate-900">{record.vitals.systolicBp ? `${record.vitals.systolicBp}/${record.vitals.diastolicBp}` : 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">TEMP</span>
                <span className="font-bold text-slate-900">{record.vitals.temperatureC ? `${record.vitals.temperatureC}°C` : 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">SpO2</span>
                <span className="font-bold text-slate-900">{record.vitals.oxygenSaturationSpO2 ? `${record.vitals.oxygenSaturationSpO2}%` : 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">RR</span>
                <span className="font-bold text-slate-900">{record.vitals.respiratoryRate ? `${record.vitals.respiratoryRate}/min` : 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-slate-500 block text-[10px]">GLUCOSE</span>
                <span className="font-bold text-slate-900">{record.vitals.bloodGlucoseMgDl ? `${record.vitals.bloodGlucoseMgDl} mg/dL` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Red Flag Warnings */}
          {record.redFlagWarnings && record.redFlagWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="font-bold text-red-900 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Immediate Red Flags & Clinical Alerts</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-red-900 font-medium">
                {record.redFlagWarnings.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vernacular Transcript & Clinical Concept */}
          <div className="border border-slate-200 p-3 rounded-lg space-y-2">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Original Spoken Intake Notes
              </span>
              <p className="text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-100">
                "{record.rawIntakeNotes}"
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Working Differential & Concepts
              </span>
              <p className="text-slate-900 font-semibold">
                {record.differentialConsiderations?.join(', ') || 'Acute clinical evaluation required'}
              </p>
            </div>
          </div>

          {/* Clinical Rationale & First-line treatments given */}
          <div className="border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Triage Rationale & Initiated First-Line Care
            </span>
            <p className="text-slate-800 mt-1">{record.urgencyReasoning}</p>
            {record.recommendedFirstLineActions?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">
                  En-Route / Stabilization Directives:
                </span>
                <ul className="list-disc list-inside text-slate-700">
                  {record.recommendedFirstLineActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Signature lines */}
          <div className="pt-4 grid grid-cols-2 gap-6 border-t border-slate-200 text-slate-600">
            <div>
              <div className="border-b border-slate-400 pb-6 mb-1"></div>
              <div className="text-[11px] font-semibold">Referring Clinic Nurse / Medical Officer</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-6 mb-1"></div>
              <div className="text-[11px] font-semibold">Receiving Hospital Triage Desk / Physician</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
