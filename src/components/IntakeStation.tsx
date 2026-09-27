import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  HeartPulse,
  RotateCcw,
  FileText,
  Thermometer,
  Gauge,
  Wind,
  Droplet,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  Activity,
} from 'lucide-react';
import { VitalSigns } from '../types';
import { SAMPLE_CASES, SampleCase } from '../data/sampleCases';

interface IntakeStationProps {
  onAnalyze: (intakeText: string, manualVitals: Partial<VitalSigns>, clinicContext: any) => Promise<void>;
  isLoading: boolean;
}

export function IntakeStation({ onAnalyze, isLoading }: IntakeStationProps) {
  const [intakeText, setIntakeText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showVitalsEntry, setShowVitalsEntry] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [clinicRegion, setClinicRegion] = useState('Sub-District Primary Health Post');
  const [nurseName, setNurseName] = useState('Staff Nurse');

  // Manual Vitals State
  const [heartRate, setHeartRate] = useState<string>('');
  const [systolicBp, setSystolicBp] = useState<string>('');
  const [diastolicBp, setDiastolicBp] = useState<string>('');
  const [tempC, setTempC] = useState<string>('');
  const [spO2, setSpO2] = useState<string>('');
  const [respRate, setRespRate] = useState<string>('');
  const [glucose, setGlucose] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice Dictation Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setIntakeText((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.warn('Speech recognition could not start:', e);
          setIsRecording(false);
        }
      } else {
        alert('Speech recognition is not supported in this browser environment. You can type or paste intake notes directly.');
      }
    }
  };

  const loadPresetCase = (sampleCase: SampleCase) => {
    setSelectedCaseId(sampleCase.id);
    setIntakeText(sampleCase.notes);
    setClinicRegion(sampleCase.locationContext);

    // Populate vitals
    if (sampleCase.vitals) {
      setHeartRate(sampleCase.vitals.heartRateBpm?.toString() || '');
      setSystolicBp(sampleCase.vitals.systolicBp?.toString() || '');
      setDiastolicBp(sampleCase.vitals.diastolicBp?.toString() || '');
      setTempC(sampleCase.vitals.temperatureC?.toString() || '');
      setSpO2(sampleCase.vitals.oxygenSaturationSpO2?.toString() || '');
      setRespRate(sampleCase.vitals.respiratoryRate?.toString() || '');
      setGlucose(sampleCase.vitals.bloodGlucoseMgDl?.toString() || '');
    } else {
      clearVitals();
    }
  };

  const clearVitals = () => {
    setHeartRate('');
    setSystolicBp('');
    setDiastolicBp('');
    setTempC('');
    setSpO2('');
    setRespRate('');
    setGlucose('');
  };

  const handleReset = () => {
    setIntakeText('');
    setSelectedCaseId('');
    clearVitals();
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!intakeText.trim() || isLoading) return;

    const manualVitals: Partial<VitalSigns> = {
      heartRateBpm: heartRate ? Number(heartRate) : null,
      systolicBp: systolicBp ? Number(systolicBp) : null,
      diastolicBp: diastolicBp ? Number(diastolicBp) : null,
      temperatureC: tempC ? Number(tempC) : null,
      oxygenSaturationSpO2: spO2 ? Number(spO2) : null,
      respiratoryRate: respRate ? Number(respRate) : null,
      bloodGlucoseMgDl: glucose ? Number(glucose) : null,
    };

    onAnalyze(intakeText, manualVitals, {
      clinicName: clinicRegion,
      nurseName,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 mb-6">
      {/* Station Title & Preset Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 bg-slate-50/50 -m-5 md:-m-6 p-4 md:p-5 mb-5 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Patient Intake & Spoken Symptom Notes
              </h2>
              <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded tracking-wider">
                TRANSCRIBED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Accepts clinician shorthand, colloquial vernacular phrases, and audio transcripts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!intakeText && !heartRate}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Rural Case Selector */}
      <div className="mb-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Standardized Clinical Scenarios:</span>
          <span className="text-[10px] text-slate-400 font-normal">Click any case to test intake ingestion</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SAMPLE_CASES.map((c) => {
            const isSelected = selectedCaseId === c.id;
            let badgeColor = 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/60';
            if (c.category === 'Critical') {
              badgeColor = isSelected
                ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                : 'border-red-200 hover:border-red-400 text-red-800 bg-red-50/40';
            } else if (c.category === 'Urgent') {
              badgeColor = isSelected
                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                : 'border-amber-200 hover:border-amber-400 text-amber-800 bg-amber-50/40';
            } else {
              badgeColor = isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-blue-300 text-slate-700 bg-slate-50/40';
            }

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => loadPresetCase(c)}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col justify-between h-full cursor-pointer shadow-2xs ${badgeColor}`}
              >
                <div className="font-bold line-clamp-1">{c.title}</div>
                <div className="text-[10px] mt-1.5 opacity-90 flex items-center justify-between font-semibold">
                  <span className="uppercase tracking-wider">{c.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Intake Notes Textarea */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={intakeText}
            onChange={(e) => setIntakeText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Enter patient observations or vernacular quotes (e.g., 'Woman late 20s, burning stomach for two days, head spinning, too hot to touch, 3rd trimester pregnancy...')"
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y transition-all leading-relaxed font-sans shadow-2xs"
          />

          {/* Voice Input Floating Trigger inside Textarea Corner */}
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isRecording ? 'Stop Voice Recording' : 'Start Voice Dictation'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isRecording ? 'Listening...' : 'Dictate'}</span>
            </button>
          </div>
        </div>

        {/* Measured Vitals Entry Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <button
            type="button"
            onClick={() => setShowVitalsEntry(!showVitalsEntry)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-blue-600" />
              <span>Direct Measured Physiological Vitals (Optional)</span>
              {(heartRate || systolicBp || tempC || spO2) && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Values Loaded
                </span>
              )}
            </div>
            {showVitalsEntry ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showVitalsEntry && (
            <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g. 110"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-slate-400" />
                  BP (mmHg)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value)}
                    placeholder="Sys"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                  />
                  <span className="text-slate-400 text-xs font-bold">/</span>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value)}
                    placeholder="Dia"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-slate-400" />
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  placeholder="e.g. 38.8"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-slate-400" />
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  placeholder="e.g. 96"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" />
                  Resp Rate (/min)
                </label>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  placeholder="e.g. 22"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-slate-400" />
                  Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="e.g. 115"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Context */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Resilient Engine Active (gemini-3.7-flash ➔ gemini-3.1-flash-lite)</span>
          </div>

          <button
            type="submit"
            disabled={!intakeText.trim() || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Run Clinical Triage Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
