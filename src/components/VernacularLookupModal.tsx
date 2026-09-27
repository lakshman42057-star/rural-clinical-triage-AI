import { useState } from 'react';
import { X, Search, Sparkles, BookOpen, ArrowRight, HelpCircle } from 'lucide-react';
import { VERNACULAR_DICTIONARY, VernacularTerm } from '../data/vernacularDictionary';

interface VernacularLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTerm?: (termText: string) => void;
}

export function VernacularLookupModal({
  isOpen,
  onClose,
  onSelectTerm,
}: VernacularLookupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customPhrase, setCustomPhrase] = useState('');
  const [customTranslation, setCustomTranslation] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  if (!isOpen) return null;

  const filteredTerms = VERNACULAR_DICTIONARY.filter(
    (t) =>
      t.vernacularPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.medicalConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.regionalContext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomTranslate = async () => {
    if (!customPhrase.trim() || isTranslating) return;
    setIsTranslating(true);
    setCustomTranslation(null);

    try {
      const res = await fetch('/api/triage/translate-vernacular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: customPhrase }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCustomTranslation(data.data);
      } else {
        alert(data.error || 'Failed to translate vernacular phrase.');
      }
    } catch (e: any) {
      alert('Error translating phrase.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rural Vernacular Medical Glossary & Concept Dictionary
              </h3>
              <p className="text-[11px] text-slate-500">
                Cross-reference localized idioms, colloquial illness phrases, and red-flag thresholds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
          {/* Custom AI Vernacular Linguist Tool */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Live AI Vernacular Concept Translator
            </h4>
            <p className="text-slate-600 text-[11px] mb-3">
              Type any unfamiliar local phrase spoken by a patient or community member to extract standard clinical concepts and triage questions.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomTranslate()}
                placeholder="e.g. 'fire running in my belly and head spinning like top'..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleCustomTranslate}
                disabled={!customPhrase.trim() || isTranslating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isTranslating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Translate</span>
                )}
              </button>
            </div>

            {customTranslation && (
              <div className="mt-3 bg-white p-3.5 rounded-lg border border-blue-200 text-slate-800 space-y-2 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">
                    Standardized Medical Concept:
                  </span>
                  <span className="text-xs font-extrabold text-blue-950">
                    {customTranslation.standardizedConcept}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Clinical Definition:
                  </span>
                  <span className="text-xs text-slate-700">{customTranslation.clinicalDefinition}</span>
                </div>
                {customTranslation.potentialCauses?.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Differential Causes:
                    </span>
                    <span className="text-xs font-medium text-slate-800">
                      {customTranslation.potentialCauses.join(' • ')}
                    </span>
                  </div>
                )}
                {customTranslation.triageFollowUpQuestions?.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                      Key Triage Questions for Nurse:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {customTranslation.triageFollowUpQuestions.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Curated Glossary */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Common Rural Vernacular Index
              </h4>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search idioms or concepts..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredTerms.map((term, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 text-xs">
                      "{term.vernacularPhrase}"
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium shrink-0">
                      {term.regionalContext}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{term.medicalConcept}</span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-700">Clinical Significance: </strong>
                    {term.clinicalSignificance}
                  </div>

                  <div className="text-[11px] text-red-900 bg-red-50/90 p-2 rounded border border-red-200 font-medium">
                    <strong className="text-red-950">⚠️ Red Flag Warning: </strong>
                    {term.redFlagThreshold}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
