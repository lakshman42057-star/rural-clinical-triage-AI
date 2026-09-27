import { X, ShieldCheck, ShieldAlert, Lock, Database, Cpu, Globe, Server } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThreatModelModal({ isOpen, onClose }: ThreatModelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Agentic Threat Model & Guardrails (The 5 Threat Zones)
              </h3>
              <p className="text-[11px] text-slate-300">
                Security architecture and countermeasure matrix for clinical AI deployment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
          {/* Threat Summary Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Threat Summary & Countermeasure Table
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 font-bold">
                    <th className="py-2.5 px-3">Threat Zone</th>
                    <th className="py-2.5 px-3">Identified Risk / Attack Vector</th>
                    <th className="py-2.5 px-3">Enforced Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      1. Input Surfaces
                    </td>
                    <td className="py-2.5 px-3">
                      Untrusted intake notes, malicious voice transcripts, indirect prompt injection (OWASP LLM01), oversized payloads.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Top-level body parser limit (2MB), strict length validation, zero-instruction execution, untrusted data treated purely as raw text tokens.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      2. Planning & Reasoning
                    </td>
                    <td className="py-2.5 px-3">
                      System instruction bypass, hallucinated dangerous dosages, misclassification of emergency shock states.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Strict response schema with JSON validation, system prompt bounding, hardcoded physiological safety triggers (SpO2 &lt; 90% or SBP &lt; 80 mmHg forces CRITICAL tier).
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-600" />
                      3. Tool Execution
                    </td>
                    <td className="py-2.5 px-3">
                      Privilege escalation, SSRF via API callbacks, dynamic code execution.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Zero dynamic code evaluation (`eval`), deterministic server-side endpoints, authenticated API gateways, no external URL fetch by model.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      4. Memory & State
                    </td>
                    <td className="py-2.5 px-3">
                      Cross-patient data leaks, session hijacking, corrupted persistence records, undefined crashes.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Strict undefined-stripping on payloads, owner-isolated client storage, nurse manual override audit log, zero in-memory cross-session retention.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      5. Inter-System Communication
                    </td>
                    <td className="py-2.5 px-3">
                      API key exposure to client browser, plaintext transmission of PHI, upstream provider downtime.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Server-side-only Gemini SDK with `GEMINI_API_KEY`, resilient model fallback ladder (`gemini-3.7-flash` ➔ `gemini-3.1-flash-lite`), Secret Manager integration.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Autonomy & Safety Policy */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Clinical Guardrails & Human-In-The-Loop Principle
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Rural Clinical Triage AI acts as a <strong>decision-support copilot</strong> for nurses, clinical officers, and community health workers (CHWs). The system:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              <li>Requires qualified nurse confirmation before final disposition.</li>
              <li>Supports an instantaneous <strong>Nurse Urgency Override</strong> with mandatory clinical audit reasoning.</li>
              <li>Provides hard safety overrides for extreme vitals (e.g. oxygen saturation &lt; 90% or systolic BP &lt; 80 mmHg automatically triggers emergency tier).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
