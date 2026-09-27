import { useState } from 'react';
import {
  Users,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Eye,
  Trash2,
  Check,
} from 'lucide-react';
import { TriageRecord, TriageStatus, TriageUrgencyLevel } from '../types';

interface TriageQueueProps {
  records: TriageRecord[];
  selectedRecordId: string | null;
  onSelectRecord: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: TriageStatus) => void;
  onDeleteRecord: (id: string) => void;
}

export function TriageQueue({
  records,
  selectedRecordId,
  onSelectRecord,
  onUpdateStatus,
  onDeleteRecord,
}: TriageQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [exportCopied, setExportCopied] = useState(false);

  const filteredRecords = records.filter((r) => {
    const effectiveUrgency = r.manualUrgencyOverride || r.urgencyLevel;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || effectiveUrgency === urgencyFilter;
    return matchesStatus && matchesUrgency;
  });

  const exportAllJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rural-triage-registry-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Clinical Triage Registry & Outpost Patient Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active patient flow, urgency categorization, and district referral export
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {records.length > 0 && (
            <button
              type="button"
              onClick={exportAllJson}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download full registry as standardized JSON"
            >
              {exportCopied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
              <span>Export Registry (.json)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setUrgencyFilter('all')}
            className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
              urgencyFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            All Tiers ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setUrgencyFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
              urgencyFilter === 'CRITICAL' ? 'bg-red-600 text-white font-bold shadow-2xs' : 'text-red-700'
            }`}
          >
            Critical ({records.filter((r) => (r.manualUrgencyOverride || r.urgencyLevel) === 'CRITICAL').length})
          </button>
          <button
            type="button"
            onClick={() => setUrgencyFilter('URGENT')}
            className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
              urgencyFilter === 'URGENT' ? 'bg-amber-600 text-white font-bold shadow-2xs' : 'text-amber-700'
            }`}
          >
            Urgent ({records.filter((r) => (r.manualUrgencyOverride || r.urgencyLevel) === 'URGENT').length})
          </button>
          <button
            type="button"
            onClick={() => setUrgencyFilter('NON-URGENT')}
            className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
              urgencyFilter === 'NON-URGENT' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-emerald-700'
            }`}
          >
            Non-Urgent ({records.filter((r) => (r.manualUrgencyOverride || r.urgencyLevel) === 'NON-URGENT').length})
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded font-medium cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            All Statuses
          </button>
          {(['waiting', 'in-consult', 'referred', 'discharged'] as TriageStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded font-medium capitalize cursor-pointer ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No triage records in this view</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit intake notes above or click one of the rural test case presets.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">Urgency Tier</th>
                  <th className="py-2.5 px-3">Patient / Demographics</th>
                  <th className="py-2.5 px-3">Chief Complaint (Vernacular)</th>
                  <th className="py-2.5 px-3">Key Vitals</th>
                  <th className="py-2.5 px-3">Clinical Status</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => {
                  const effectiveUrgency = r.manualUrgencyOverride || r.urgencyLevel;
                  const isSelected = selectedRecordId === r.id;

                  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  let TierIcon = CheckCircle2;
                  if (effectiveUrgency === 'CRITICAL') {
                    badgeColor = 'bg-red-100 text-red-800 border-red-200 font-extrabold';
                    TierIcon = AlertOctagon;
                  } else if (effectiveUrgency === 'URGENT') {
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
                    TierIcon = AlertTriangle;
                  }

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRecord(r.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${badgeColor}`}
                        >
                          <TierIcon className="w-3 h-3 shrink-0" />
                          <span>{effectiveUrgency}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{r.patient.name || 'Anonymous'}</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {r.patient.age ? `${r.patient.age}y` : ''} {r.patient.gender || ''}
                          {r.patient.isPregnant && ' • Pregnant'}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="truncate text-slate-700">
                          {r.chiefComplaints?.[0]?.vernacularPhrase || r.symptoms?.[0]?.symptom || 'Intake noted'}
                        </div>
                        <div className="text-[10px] text-blue-800 font-medium truncate">
                          ➔ {r.chiefComplaints?.[0]?.standardizedMedicalConcept || r.symptoms?.[0]?.symptom}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {r.vitals.heartRateBpm && `HR: ${r.vitals.heartRateBpm} `}
                        {r.vitals.systolicBp && `BP: ${r.vitals.systolicBp}/${r.vitals.diastolicBp} `}
                        {r.vitals.temperatureC && `T: ${r.vitals.temperatureC}°C `}
                        {r.vitals.oxygenSaturationSpO2 && `SpO2: ${r.vitals.oxygenSaturationSpO2}%`}
                        {!r.vitals.heartRateBpm && !r.vitals.temperatureC && 'No vitals'}
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={r.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateStatus(r.id, e.target.value as TriageStatus)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-medium text-slate-700 capitalize focus:outline-hidden focus:border-blue-600"
                        >
                          <option value="waiting">Waiting</option>
                          <option value="in-consult">In Consult</option>
                          <option value="referred">Referred</option>
                          <option value="discharged">Discharged</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(r.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                            title="View Full Triage Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                            title="Remove Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
