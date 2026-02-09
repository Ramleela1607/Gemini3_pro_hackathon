
import React, { useRef, useState, useEffect } from 'react';
import { Category, SUPPORTED_LANGUAGES, LearningMode, AccessibilityPreference, AgeGroup } from '../types';

interface InputSectionProps {
  category: Category;
  setCategory: (c: Category) => void;
  learningMode: LearningMode;
  setLearningMode: (m: LearningMode) => void;
  accPreference?: AccessibilityPreference;
  setAccPreference: (p: AccessibilityPreference | undefined) => void;
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  studentAnswer: string;
  setStudentAnswer: React.Dispatch<React.SetStateAction<string>>;
  correctAnswer: string;
  setCorrectAnswer: (s: string) => void;
  outputLanguage: string;
  setOutputLanguage: (s: string) => void;
  imagePreview: string | null;
  setImagePreview: (s: string | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  ageGroup?: AgeGroup;
  parentalConsent?: boolean;
}

enum GuidedStep {
  IDLE = 'IDLE',
  LANGUAGE = 'LANGUAGE',
  CONTEXT = 'CONTEXT',
  ATTEMPT = 'ATTEMPT',
  ANALYZING = 'ANALYZING'
}

const InputSection: React.FC<InputSectionProps> = ({
  category,
  setCategory,
  learningMode,
  setLearningMode,
  accPreference,
  setAccPreference,
  question,
  setQuestion,
  studentAnswer,
  setStudentAnswer,
  correctAnswer,
  setCorrectAnswer,
  outputLanguage,
  setOutputLanguage,
  imagePreview,
  setImagePreview,
  onAnalyze,
  isLoading,
  ageGroup,
  parentalConsent
}) => {
  const [isListeningQuestion, setIsListeningQuestion] = useState(false);
  const [isListeningAnswer, setIsListeningAnswer] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>(GuidedStep.IDLE);
  const [showSilenceBanner, setShowSilenceBanner] = useState(false);
  const [repromptCount, setRepromptCount] = useState(0);
  
  const activeRecognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const isAudioOnly = accPreference === AccessibilityPreference.AUDIO;
  const isChild = ageGroup === '6–9' || ageGroup === '10–12';
  const hasConsent = !isChild || parentalConsent;

  const allowedModes = isChild 
    ? [LearningMode.KIDS] 
    : [LearningMode.STANDARD, LearningMode.ACCESSIBILITY];

  const speak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  const resetSilenceTimer = (customMsg?: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!isAudioOnly || guidedStep === GuidedStep.IDLE || guidedStep === GuidedStep.ANALYZING) return;

    silenceTimerRef.current = window.setTimeout(() => {
      handleSilence(customMsg);
    }, 15000);
  };

  const handleSilence = (customMsg?: string) => {
    if (repromptCount < 2) {
      const msg = customMsg || "I'm sorry, I didn’t quite hear a response. Let's try again. You can speak now, or switch modes if you prefer.";
      setShowSilenceBanner(true);
      speak(msg, () => {
        setRepromptCount(prev => prev + 1);
        startListeningForStep(guidedStep);
      });
    } else {
      speak("That's perfectly okay. I'll stay here if you need me.");
      setShowSilenceBanner(true);
      setGuidedStep(GuidedStep.IDLE);
    }
  };

  const handleSectionReset = (section: 'question' | 'answer') => {
    if (section === 'question') {
      setQuestion('');
      if (isAudioOnly) {
        if (activeRecognitionRef.current) activeRecognitionRef.current.stop();
        setGuidedStep(GuidedStep.CONTEXT);
        setRepromptCount(0);
        speak("Let’s start fresh. Please tell me the problem again.", () => {
          startListeningForStep(GuidedStep.CONTEXT);
          resetSilenceTimer("I'm waiting to hear the problem. Please say it when you're ready.");
        });
      }
    } else {
      setStudentAnswer('');
      if (isAudioOnly) {
        if (activeRecognitionRef.current) activeRecognitionRef.current.stop();
        setGuidedStep(GuidedStep.ATTEMPT);
        setRepromptCount(0);
        speak("Let’s start fresh. Tell me how you tried again.", () => {
          startListeningForStep(GuidedStep.ATTEMPT);
          resetSilenceTimer("I'm waiting to hear how you tried. What are your thoughts?");
        });
      }
    }
  };

  useEffect(() => {
    if (isAudioOnly && guidedStep === GuidedStep.IDLE && !isLoading) {
      if (!hasConsent) {
        speak("Parental consent is required to continue. Please confirm to start learning.");
      } else {
        setGuidedStep(GuidedStep.LANGUAGE);
      }
    }
    if (!isAudioOnly) {
      setGuidedStep(GuidedStep.IDLE);
      setShowSilenceBanner(false);
    }
  }, [isAudioOnly, isLoading, hasConsent]);

  useEffect(() => {
    if (guidedStep !== GuidedStep.IDLE && guidedStep !== GuidedStep.ANALYZING) {
      runStep(guidedStep);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (activeRecognitionRef.current) activeRecognitionRef.current.stop();
    };
  }, [guidedStep]);

  const runStep = (step: GuidedStep) => {
    switch (step) {
      case GuidedStep.LANGUAGE:
        speak("Hello! I'm so glad we're learning together. Which language do you prefer?", () => {
          startListeningForStep(step);
          resetSilenceTimer();
        });
        break;
      case GuidedStep.CONTEXT:
        speak("Tell me the problem you're working on. You can explain it in your own words.", () => {
          startListeningForStep(step);
          resetSilenceTimer();
        });
        break;
      case GuidedStep.ATTEMPT:
        speak("Tell me how you tried to solve it. It's okay to be unsure!", () => {
          startListeningForStep(step);
          resetSilenceTimer();
        });
        break;
    }
  };

  const startListeningForStep = (step: GuidedStep) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (activeRecognitionRef.current) {
        try { activeRecognitionRef.current.stop(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    activeRecognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const lowerTranscript = transcript.toLowerCase().trim();

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setShowSilenceBanner(false);
      setRepromptCount(0);

      // Handle Spoken Reset Command
      if (lowerTranscript === "reset") {
        if (step === GuidedStep.CONTEXT) {
          handleSectionReset('question');
          return;
        } else if (step === GuidedStep.ATTEMPT) {
          handleSectionReset('answer');
          return;
        }
      }

      if (lowerTranscript.includes("text mode")) {
        speak("Switching to text mode.", () => {
            setAccPreference(AccessibilityPreference.TEXT);
            setGuidedStep(GuidedStep.IDLE);
        });
        return;
      }

      if (step === GuidedStep.LANGUAGE) {
        setOutputLanguage(transcript);
        speak(`Helping you in ${transcript}.`, () => setGuidedStep(GuidedStep.CONTEXT));
      } else if (step === GuidedStep.CONTEXT) {
        setQuestion(transcript);
        speak("Got it.", () => setGuidedStep(GuidedStep.ATTEMPT));
      } else if (step === GuidedStep.ATTEMPT) {
        setStudentAnswer(transcript);
        speak("Let me look at this.", () => {
          setGuidedStep(GuidedStep.ANALYZING);
          onAnalyze();
        });
      }
    };

    recognition.onerror = () => { activeRecognitionRef.current = null; };
    recognition.onend = () => { activeRecognitionRef.current = null; };

    try { recognition.start(); } catch (e) {}
  };

  const startVoiceInput = (target: 'question' | 'answer') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    if (target === 'question') setIsListeningQuestion(true);
    else setIsListeningAnswer(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        if (finalTranscript.toLowerCase().trim() === 'reset') {
          handleSectionReset(target);
          recognition.stop();
          return;
        }
        if (target === 'question') setQuestion(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        else setStudentAnswer(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
      }
    };

    recognition.onend = () => {
      setIsListeningQuestion(false);
      setIsListeningAnswer(false);
    };

    try { recognition.start(); } catch (e) {}
  };

  const handleModeSelection = (mode: LearningMode) => {
    if (mode === LearningMode.ACCESSIBILITY) setShowAccModal(true);
    else {
      setLearningMode(mode);
      setAccPreference(undefined);
    }
  };

  const selectAccPreference = (pref: AccessibilityPreference) => {
    setLearningMode(LearningMode.ACCESSIBILITY);
    setAccPreference(pref);
    setShowAccModal(false);
    if (pref === AccessibilityPreference.AUDIO) setGuidedStep(GuidedStep.IDLE);
  };

  return (
    <div className="p-10 md:p-20 space-y-16 relative">
      {/* Silence Banner */}
      {showSilenceBanner && (
        <div className="absolute top-0 left-0 right-0 z-[150] p-6 animate-in slide-in-from-top duration-500">
          <div className="bg-sky-600/90 backdrop-blur-xl text-white rounded-[2rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-white/20">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <div>
                <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-1">Accessibility Prompt</h4>
                <p className="text-sm font-medium opacity-90">Say "Audio mode" or "Text mode"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => selectAccPreference(AccessibilityPreference.AUDIO)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audio</button>
              <button onClick={() => selectAccPreference(AccessibilityPreference.TEXT)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Text</button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Preference Modal */}
      {showAccModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-12 space-y-10 animate-in zoom-in-95 duration-300 border border-white/10 shadow-2xl">
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Interaction Style</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">Choose how you'd like to communicate with the tutor today.</p>
            </div>
            <div className="flex flex-col gap-6">
              <button onClick={() => selectAccPreference(AccessibilityPreference.AUDIO)} className="p-10 bg-sky-50 dark:bg-sky-950/30 border-2 border-sky-100 dark:border-sky-800 rounded-[2.5rem] text-left hover:border-sky-400 transition-all group">
                <div className="flex items-center gap-5 mb-3">
                  <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></div>
                  <span className="font-black text-sky-800 dark:text-sky-300 uppercase tracking-widest text-xs">Audio Optimized</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Warm, voice-guided experience with immersive spoken feedback.</p>
              </button>
              <button onClick={() => selectAccPreference(AccessibilityPreference.TEXT)} className="p-10 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem] text-left hover:border-indigo-400 transition-all group">
                <div className="flex items-center gap-5 mb-3">
                  <div className="w-12 h-12 bg-slate-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                  <span className="font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest text-xs">Text Only</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Quiet, focus-driven text interaction. Screen reader compatible.</p>
              </button>
            </div>
            <button onClick={() => setShowAccModal(false)} className="w-full text-center text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Go Back</button>
          </div>
        </div>
      )}

      {/* Guided Voice Indicator */}
      {isAudioOnly && !isLoading && guidedStep !== GuidedStep.IDLE && (
        <div className="flex flex-col items-center gap-10 py-16 animate-in fade-in zoom-in-95">
          <div className="relative">
             <div className="w-40 h-40 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(99,102,241,0.4)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
             </div>
             <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 -z-10 scale-150"></div>
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {guidedStep === GuidedStep.LANGUAGE ? "Selecting Dialect..." : 
               guidedStep === GuidedStep.CONTEXT ? "Context Capture..." :
               guidedStep === GuidedStep.ATTEMPT ? "Logic Analysis..." :
               "Neural Processing..."}
            </h3>
            <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.4em]">System Active</p>
          </div>
        </div>
      )}

      {/* Standard UI */}
      <div className={isAudioOnly && !isLoading && guidedStep !== GuidedStep.IDLE ? 'opacity-10 pointer-events-none scale-95 blur-[4px]' : 'transition-all duration-700'}>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-6">Tutor Personalization</label>
              <div className="flex flex-wrap gap-4">
                {allowedModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeSelection(mode)}
                    className={`px-8 py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                      learningMode === mode 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-500/30 -translate-y-1' 
                        : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
                {isChild && (
                  <div className={`px-8 py-4 border-2 rounded-[1.25rem] text-[11px] font-black uppercase flex items-center gap-3 transition-colors ${parentalConsent ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {parentalConsent ? 'Consent Verified' : 'Safety Lock'}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-72">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-6">Neural Language</label>
              <div className="flex flex-col gap-2">
                 <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)} className="w-full font-bold text-sm h-[60px] cursor-pointer">
                    {SUPPORTED_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                 </select>
                 <div className="flex items-center gap-2 px-3">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto Domain Active</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-16">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <label className="block text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">Tell Me the Problem</label>
                 {category !== Category.AUTO && (
                   <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-full animate-in zoom-in-95">Detected: {category}</span>
                 )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSectionReset('question')}
                  className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition-all"
                  title="Clear section"
                >
                  Reset
                </button>
                <button 
                  onClick={() => startVoiceInput('question')} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ${isListeningQuestion ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  {isListeningQuestion ? 'Listening' : 'Dictate'}
                </button>
              </div>
            </div>
            <textarea 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              placeholder={isChild ? "Type what you're stuck on! Use your own words." : "Explain the problem in your own words. I'll automatically detect the subject!"} 
              className="w-full min-h-[160px] shadow-lg focus:scale-[1.01] font-medium leading-relaxed" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">How You Tried</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSectionReset('answer')}
                    className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition-all"
                    title="Clear section"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => startVoiceInput('answer')} 
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ${isListeningAnswer ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    {isListeningAnswer ? 'Capturing' : 'Voice Attempt'}
                  </button>
                </div>
              </div>
              <textarea value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} placeholder={isChild ? "Tell me how you tried to do it!" : "Describe your attempt or thinking process..."} className="w-full min-h-[280px] shadow-lg focus:scale-[1.01] font-medium leading-relaxed" />
            </div>

            <div className="space-y-6">
              <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">The Correct Answer (Optional)</label>
              <textarea value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="If you know the right answer, you can paste it here..." className="w-full min-h-[280px] shadow-lg focus:scale-[1.01] font-medium leading-relaxed" />
            </div>
          </div>
        </div>

        <div className="pt-16 flex flex-col items-center gap-6">
          <button
            onClick={onAnalyze}
            disabled={isLoading || !question || (!studentAnswer && !imagePreview) || (learningMode === LearningMode.KIDS && !parentalConsent)}
            className={`px-24 py-10 bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.4em] rounded-[2.5rem] transition-all duration-500 shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-30 btn-glow`}
          >
            {isLoading ? 'Thinking...' : 'Let’s Look!'}
          </button>
          
          {learningMode === LearningMode.KIDS && !parentalConsent && (
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
              Parental consent is required to start learning.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputSection;
