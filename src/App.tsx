import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IntakeStation } from './components/IntakeStation';
import { TriageResultCard } from './components/TriageResultCard';
import { TriageQueue } from './components/TriageQueue';
import { ReferralSlipModal } from './components/ReferralSlipModal';
import { VernacularLookupModal } from './components/VernacularLookupModal';
import { ThreatModelModal } from './components/ThreatModelModal';
import { ClinicalChatbot } from './components/ClinicalChatbot';
import { AppPage, TriageRecord, TriageStatus, TriageUrgencyLevel, VitalSigns } from './types';
import {
  AlertCircle,
  Activity,
  Sparkles,
  Stethoscope,
  ClipboardCheck,
  Users,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'rural_clinical_triage_records_v1';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('intake');
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Modals
  const [referralSlipRecord, setReferralSlipRecord] = useState<TriageRecord | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);

  // Load records from local cache on mount or seed with initial case
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          setSelectedRecordId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read from local storage:', e);
    }
  }, []);

  // Save to local storage on record change
  useEffect(() => {
    try {
      if (records.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      }
    } catch (e) {
      console.warn('Could not write to local storage:', e);
    }
  }, [records]);

  // Audio tone for critical alerts
  const playAlertChime = (urgency: TriageUrgencyLevel) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (urgency === 'CRITICAL') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 alert
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  const handleAnalyze = async (
    intakeText: string,
    manualVitals: Partial<VitalSigns>,
    clinicContext: any
  ) => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeText,
          manualVitals,
          clinicContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.record) {
        throw new Error(data.error || 'Failed to analyze patient intake notes.');
      }

      const newRecord: TriageRecord = data.record;

      setRecords((prev) => [newRecord, ...prev]);
      setSelectedRecordId(newRecord.id);

      // Auto-navigate to Page 2 (Triage Evaluation) so the clinician immediately reviews the results
      setCurrentPage('evaluation');

      if (newRecord.urgencyLevel === 'CRITICAL') {
        playAlertChime('CRITICAL');
      }
    } catch (err: any) {
      console.error('Triage generation error:', err);
      setErrorBanner(err?.message || 'An unexpected error occurred while analyzing intake.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: TriageStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const handleOverrideUrgency = (
    id: string,
    newUrgency: TriageUrgencyLevel,
    reason: string
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              manualUrgencyOverride: newUrgency,
              overrideReason: reason,
            }
          : r
      )
    );
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (selectedRecordId === id) {
        setSelectedRecordId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || null;
  const criticalCount = records.filter(
    (r) => (r.manualUrgencyOverride || r.urgencyLevel) === 'CRITICAL' && r.status !== 'discharged'
  ).length;
  const urgentCount = records.filter(
    (r) => (r.manualUrgencyOverride || r.urgencyLevel) === 'URGENT' && r.status !== 'discharged'
  ).length;
  const activeQueueCount = records.filter((r) => r.status !== 'discharged').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navigation Header with Option Buttons beside Vernacular Glossary */}
      <Header
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        queueCount={activeQueueCount}
        criticalCount={criticalCount}
        urgentCount={urgentCount}
        hasSelectedRecord={!!selectedRecord}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Notification Banner */}
        {errorBanner && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Triage Processing Error: </strong>
                <span>{errorBanner}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-red-700 hover:text-red-900 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---------------- PAGE 1: INTAKE STATION ---------------- */}
        {currentPage === 'intake' && (
          <div className="space-y-4">
            {/* Quick Helper Banner if there is already an active evaluation */}
            {selectedRecord && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Previously Evaluated Patient: <strong className="font-bold">{selectedRecord.patient.name || 'Unnamed Patient'}</strong>{' '}
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 uppercase">
                      {selectedRecord.manualUrgencyOverride || selectedRecord.urgencyLevel}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage('evaluation')}
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    <span>View Evaluation (Page 2)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Clinical Intake Station Form */}
            <IntakeStation onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        )}

        {/* ---------------- PAGE 2: TRIAGE EVALUATION ---------------- */}
        {currentPage === 'evaluation' && (
          <div className="space-y-4">
            {/* Navigation & Context Bar for Page 2 */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active Triage Assessment
                </h2>
                {selectedRecord && (
                  <span className="text-xs text-slate-500">
                    — Showing <strong className="text-slate-900 font-semibold">{selectedRecord.patient.name || 'Patient ' + selectedRecord.id.slice(0, 6)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Patient Selector if multiple records exist */}
                {records.length > 1 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[11px] font-medium text-slate-400">Switch Patient:</span>
                    <select
                      value={selectedRecordId || ''}
                      onChange={(e) => setSelectedRecordId(e.target.value)}
                      className="text-xs px-2 py-1 rounded bg-slate-50 border border-slate-300 font-medium text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.patient.name || 'Patient ' + r.id.slice(0, 6)} ({r.manualUrgencyOverride || r.urgencyLevel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage('intake')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ New Intake (Page 1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage('queue')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>View Queue ({activeQueueCount})</span>
                </button>
              </div>
            </div>

            {/* Active Triage Record Display */}
            {selectedRecord ? (
              <TriageResultCard
                record={selectedRecord}
                onUpdateStatus={handleUpdateStatus}
                onOverrideUrgency={handleOverrideUrgency}
                onOpenReferralSlip={(rec) => setReferralSlipRecord(rec)}
              />
            ) : (
              !isLoading && (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
                  <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-3 opacity-80" />
                  <h3 className="text-base font-bold text-slate-800">No Patient Triage Profile Selected</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Select a preset case in the Intake Station or pick an existing patient from the clinic queue to inspect their full clinical assessment.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage('intake')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Start New Intake (Page 1)</span>
                    </button>
                    {records.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentPage('queue')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Select from Queue (Page 3)</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ---------------- PAGE 3: PATIENT QUEUE & REGISTRY ---------------- */}
        {currentPage === 'queue' && (
          <div className="space-y-4">
            {/* Quick Header Navigation for Page 3 */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Clinic Queue & Transfer Slips
                </h2>
                <span className="text-xs text-slate-400">
                  — Total {records.length} registered patient{records.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedRecord && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('evaluation')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Evaluation: {selectedRecord.patient.name || 'Selected'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage('intake')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Patient Intake</span>
                </button>
              </div>
            </div>

            {/* Triage Registry & Queue Management Component */}
            <TriageQueue
              records={records}
              selectedRecordId={selectedRecordId}
              onSelectRecord={(id) => {
                setSelectedRecordId(id);
                // When selecting a record in the queue, open Page 2 to inspect full profile!
                setCurrentPage('evaluation');
              }}
              onUpdateStatus={handleUpdateStatus}
              onDeleteRecord={handleDeleteRecord}
            />
          </div>
        )}
      </main>

      {/* Referral Slip Modal */}
      <ReferralSlipModal
        record={referralSlipRecord}
        onClose={() => setReferralSlipRecord(null)}
      />

      {/* Vernacular Medical Glossary Modal */}
      <VernacularLookupModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />

      {/* Agentic Threat Model Modal */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />

      {/* Floating Clinical Decision Support Chatbot */}
      <ClinicalChatbot />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Rural Clinical Triage AI • Low-Resource Clinical Decision Support</span>
          <span>Powered by Gemini API on Google Cloud Run</span>
        </div>
      </footer>
    </div>
  );
}
