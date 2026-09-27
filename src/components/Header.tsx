import { Activity, BookOpen, Stethoscope, ShieldCheck, ClipboardCheck, Users } from 'lucide-react';
import { AppPage } from '../types';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  queueCount: number;
  criticalCount: number;
  urgentCount: number;
  hasSelectedRecord: boolean;
  onOpenDictionary: () => void;
  onOpenThreatModel: () => void;
}

export function Header({
  currentPage,
  onNavigate,
  queueCount,
  criticalCount,
  urgentCount,
  hasSelectedRecord,
  onOpenDictionary,
  onOpenThreatModel,
}: HeaderProps) {
  return (
    <header className="bg-blue-700 text-white border-b border-blue-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Clinic Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-xs">
            <div className="w-6 h-6 bg-blue-700 rounded-sm flex items-center justify-center font-black text-xs text-white">
              AI
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight text-white">
                FieldCare AI • Rural Clinical Triage
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-800 text-blue-100 border border-blue-500/40 uppercase tracking-wider">
                Low-Resource Edition
              </span>
            </div>
            <p className="text-[11px] text-blue-100 font-medium">
              Clinical Triage Assistant • Standardized Intake & Red-Flag Prioritization
            </p>
          </div>
        </div>

        {/* Live Status & Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Queue Statistics Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-blue-800/80 border border-blue-500/40 rounded-lg px-2.5 py-1.5 text-xs text-blue-100 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Active Queue: <strong className="text-white font-bold">{queueCount}</strong></span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-wide uppercase">
                {criticalCount} Critical
              </span>
            )}
            {urgentCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] tracking-wide uppercase">
                {urgentCount} Urgent
              </span>
            )}
          </div>

          {/* Option Buttons for the 3 Pages right beside Vernacular Glossary */}
          <button
            type="button"
            onClick={() => onNavigate('intake')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentPage === 'intake'
                ? 'bg-white text-blue-900 font-bold border border-white shadow-xs'
                : 'bg-blue-800 hover:bg-blue-900 border border-blue-500/40 text-white'
            }`}
            title="Page 1: Patient Intake Station (Record symptoms and vitals)"
          >
            <Stethoscope className={`w-3.5 h-3.5 ${currentPage === 'intake' ? 'text-blue-700' : 'text-blue-200'}`} />
            <span>Intake Station</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('evaluation')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentPage === 'evaluation'
                ? 'bg-white text-blue-900 font-bold border border-white shadow-xs'
                : 'bg-blue-800 hover:bg-blue-900 border border-blue-500/40 text-white'
            }`}
            title="Page 2: Clinical Triage Evaluation (Detailed assessment, alerts & actions)"
          >
            <ClipboardCheck className={`w-3.5 h-3.5 ${currentPage === 'evaluation' ? 'text-blue-700' : 'text-blue-200'}`} />
            <span>Triage Evaluation</span>
            {hasSelectedRecord && (
              <span
                className={`w-2 h-2 rounded-full ${currentPage === 'evaluation' ? 'bg-blue-600' : 'bg-emerald-400'}`}
                title="Active patient record loaded"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('queue')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentPage === 'queue'
                ? 'bg-white text-blue-900 font-bold border border-white shadow-xs'
                : 'bg-blue-800 hover:bg-blue-900 border border-blue-500/40 text-white'
            }`}
            title="Page 3: Live Patient Queue & Outpost Registry"
          >
            <Users className={`w-3.5 h-3.5 ${currentPage === 'queue' ? 'text-blue-700' : 'text-blue-200'}`} />
            <span>Patient Queue</span>
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                currentPage === 'queue'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-blue-900 text-blue-200 border border-blue-400/40'
              }`}
            >
              {queueCount}
            </span>
          </button>

          {/* Vernacular Medical Glossary Button */}
          <button
            type="button"
            onClick={onOpenDictionary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 border border-blue-500/40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Search rural vernacular symptom translations"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-200" />
            <span>Vernacular Glossary</span>
          </button>

          {/* Security & Threat Architecture Button */}
          <button
            type="button"
            onClick={onOpenThreatModel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border border-slate-700"
            title="View 5-Zone Agentic Threat Model & Guardrails"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Threat Model</span>
          </button>

          {/* Clinician On-Duty Profile Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-blue-600/60">
            <div className="text-right text-xs">
              <p className="font-semibold text-white leading-tight">Duty Officer</p>
              <p className="text-[10px] text-blue-200 leading-tight">Outpost 42</p>
            </div>
            <div className="h-8 w-8 bg-blue-900 text-blue-100 rounded-full border border-blue-400 flex items-center justify-center font-bold text-xs">
              RN
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

