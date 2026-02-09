
import React, { useState } from 'react';
import { AnalysisResult, PracticeEvaluation, LearningMode } from '../types';
import { evaluatePracticeAnswers, getAlternativeExplanation, getRealLifeExample } from '../services/geminiService';

interface ResultDisplayProps {
  result: AnalysisResult;
  learningMode: LearningMode;
  userName?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, learningMode, userName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Interactive Practice State
  const [userAnswers, setUserAnswers] = useState<string[]>(['', '', '']);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Alternative Explanation State
  const [alternativeEx, setAlternativeEx] = useState<string | null>(null);
  const [isFetchingAlt, setIsFetchingAlt] = useState(false);

  // Real-Life Example State
  const [realLifeEx, setRealLifeEx] = useState<string | null>(null);
  const [isFetchingRealLife, setIsFetchingRealLife] = useState(false);

  const speakResponse = (text?: string) => {
    const content = text || result.voiceOnlyResponse;
    if (!content) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = async () => {
    const shareText = `🧠 My Learning Insight from Explain-My-Mistake:\n\nStatus: ${result.learningStatus}\n\nKey Insight: "${result.keyInsight}"\n\nDiagnosis: ${result.diagnosis}\n\nPowered by Gemini 3. Human-Centered AI Tutor.`;
    
    const shareData: ShareData = {
      title: 'My Learning Insight',
      text: shareText,
    };

    // Safely attempt to add the URL, avoiding "Invalid URL" errors in sandboxed/preview environments
    try {
      const currentUrl = window.location.href;
      if (currentUrl && currentUrl.startsWith('http')) {
        shareData.url = currentUrl;
      }
    } catch (e) {
      // URL access failed or invalid, proceed without it
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // If user cancelled (AbortError), do nothing. Otherwise, fallback to clipboard.
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          await copyToClipboard(shareText);
        }
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const handleRequestAlternative = async () => {
    setIsFetchingAlt(true);
    try {
      const alt = await getAlternativeExplanation(
        result.learningStatus, 
        result.misconceptionTag, 
        result.diagnosis, 
        learningMode,
        'English',
        userName
      );
      setAlternativeEx(alt);
    } catch (err) {
      console.error('Failed to get alternative:', err);
    } finally {
      setIsFetchingAlt(false);
    }
  };

  const handleRequestRealLife = async () => {
    setIsFetchingRealLife(true);
    try {
      const ex = await getRealLifeExample(
        result.keyInsight || result.learningStatus,
        learningMode,
        'English',
        userName
      );
      setRealLifeEx(ex);
    } catch (err) {
      console.error('Failed to get real-life example:', err);
    } finally {
      setIsFetchingRealLife(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmitPractice = async () => {
    if (userAnswers.every(a => !a.trim())) return;
    
    setIsEvaluating(true);
    setEvalError(null);
    try {
      const evalResult = await evaluatePracticeAnswers(
        result.diagnosis + " " + result.correctReasoning,
        result.practiceQuestions.slice(0, 3),
        userAnswers,
        'English', 
        learningMode,
        userName
      );
      setEvaluation(evalResult);
    } catch (err: any) {
      setEvalError(err.message || "Failed to evaluate answers.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetPractice = () => {
    setEvaluation(null);
    setUserAnswers(['', '', '']);
  };

  return (
    <article className="animate-in fade-in duration-700">
      {/* 1. Learning Status & Share */}
      <section className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">Learning Status</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{result.learningStatus}</p>
        </div>
        <button 
          onClick={handleShare}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border border-slate-200 dark:border-slate-700 ${isCopied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}
          title="Share analysis"
        >
          {isCopied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Copied
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Share
            </>
          )}
        </button>
      </section>

      {/* Voice Action (Conditional) */}
      {result.voiceOnlyResponse && (
        <section className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
             </div>
             <p className="text-sm font-bold italic opacity-90">Audio Coach Script Active</p>
          </div>
          <button 
            onClick={() => speakResponse()}
            className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            {isPlaying ? 'Stop' : 'Play Audio'}
          </button>
        </section>
      )}

      {/* 2. Reasoning (Diagnosis & Correct Path) */}
      <div className="grid md:grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
        <section className="bg-white dark:bg-slate-900 p-8 space-y-4">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Why it's tricky</span>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{result.diagnosis}</p>
        </section>
        <section className="bg-white dark:bg-slate-900 p-8 space-y-4">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">The Better Way</span>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{result.correctReasoning}</p>
        </section>
      </div>

      <div className="p-8 space-y-12">
        {/* Help Options Row */}
        <div className="flex flex-wrap justify-center gap-4 -mt-6">
          <button 
            onClick={handleRequestAlternative}
            disabled={isFetchingAlt}
            className="flex items-center gap-3 px-8 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isFetchingAlt ? 'animate-spin' : ''}>
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            {isFetchingAlt ? 'Crafting Analogy...' : (alternativeEx ? 'Show Another way' : 'Explain it another way')}
          </button>

          {!realLifeEx && (
            <button 
              onClick={handleRequestRealLife}
              disabled={isFetchingRealLife}
              className="flex items-center gap-3 px-8 py-3 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isFetchingRealLife ? 'animate-spin' : ''}>
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
              </svg>
              {isFetchingRealLife ? 'Finding Examples...' : 'Real-life example?'}
            </button>
          )}
        </div>

        {/* Alternative Explanation Content */}
        {alternativeEx && (
          <section className="p-10 bg-indigo-50/30 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/40 rounded-[3rem] animate-in slide-in-from-top-4 duration-500 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </div>
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Fresh Perspective</h4>
             </div>
             <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">{alternativeEx}</p>
             <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => speakResponse(alternativeEx)}
                  className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  Hear this version
                </button>
             </div>
          </section>
        )}

        {/* Real-Life Example Content */}
        {realLifeEx && (
          <section className="p-10 bg-emerald-50/30 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-[3rem] animate-in slide-in-from-top-4 duration-500 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">In the Real World</h4>
             </div>
             <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">{realLifeEx}</p>
             <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => speakResponse(realLifeEx)}
                  className="text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  Hear this example
                </button>
             </div>
          </section>
        )}

        {/* 3. Key Insight */}
        <section className="py-6 border-b border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-3">Key Point</span>
          <p className="text-2xl font-black italic text-indigo-600 dark:text-indigo-400">"{result.keyInsight}"</p>
        </section>

        {/* 4. Quick Practice Mode */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quick Practice</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Give it a try!</h3>
            </div>
            {evaluation && (
              <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 rounded-2xl animate-in slide-in-from-right-4">
                 <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">Learning Check: {evaluation.score} / {evaluation.maxScore}</span>
                 <div className="w-px h-4 bg-indigo-200 dark:bg-indigo-800"></div>
                 <button onClick={handleResetPractice} className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Try Again</button>
              </div>
            )}
          </div>
          
          <div className="grid gap-10">
            {result.practiceQuestions.slice(0, 3).map((q, i) => (
              <div key={i} className={`p-8 md:p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border transition-all duration-500 ${evaluation ? (evaluation.results[i].isCorrect ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10' : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10') : 'border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-start gap-6 mb-8">
                  <span className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all ${evaluation ? (evaluation.results[i].isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20') : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'}`}>
                    {evaluation ? (evaluation.results[i].isCorrect ? '✓' : '✕') : i+1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-900 dark:text-white font-black text-base leading-snug mb-3">{q}</p>
                    {evaluation && !evaluation.results[i].isCorrect && (
                      <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs animate-in slide-in-from-left-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="leading-relaxed">{evaluation.results[i].feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={userAnswers[i]}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    disabled={!!evaluation || isEvaluating}
                    placeholder={learningMode === LearningMode.KIDS ? "Type 'True' or 'False'..." : `Your answer for slot ${i+1}...`}
                    className={`w-full !px-8 !py-5 text-sm font-bold border-2 transition-all shadow-inner ${evaluation ? (evaluation.results[i].isCorrect ? '!border-emerald-500/40 !bg-emerald-50/20' : '!border-rose-500/40 !bg-rose-50/20') : ''}`}
                  />
                  {evaluation && evaluation.results[i].isCorrect && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in-75">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!evaluation ? (
            <div className="flex flex-col items-center gap-6 pt-6">
              <button
                onClick={handleSubmitPractice}
                disabled={isEvaluating || userAnswers.every(a => !a.trim())}
                className="px-20 py-8 bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-30 btn-glow transition-all"
              >
                {isEvaluating ? 'Checking...' : 'Check My Answers'}
              </button>
              {evalError && <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/10 px-4 py-2 rounded-lg">{evalError}</p>}
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95">
              <div className="p-12 bg-indigo-600 text-white rounded-[3.5rem] shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-md mb-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <h4 className="text-4xl font-black tracking-tight leading-tight">{evaluation.performanceMessage}</h4>
                <p className="text-indigo-100 font-bold opacity-90 max-w-xl mx-auto leading-relaxed italic">
                  {evaluation.patternExplanation || "You're doing great! Every try is a win."}
                </p>
                
                {/* Learning Snapshot */}
                {evaluation.learningSnapshot && evaluation.learningSnapshot.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/20 text-left space-y-4 max-w-md mx-auto">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] block mb-2">Learning Snapshot</span>
                    <ul className="space-y-3">
                      {evaluation.learningSnapshot.map((point, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-medium leading-relaxed group">
                           <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0 group-hover:scale-125 transition-transform" />
                           <span className="opacity-90">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-6 flex flex-wrap justify-center gap-4">
                  <button 
                     onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                     className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-50 transition-all hover:-translate-y-1"
                  >
                    Keep Going
                  </button>
                  <button 
                     onClick={handleResetPractice}
                     className="px-10 py-4 bg-indigo-500/40 text-white border border-white/20 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-500 transition-all hover:-translate-y-1"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. Adaptive Follow-up Question */}
        <section className="p-10 border-2 border-dashed border-indigo-100 dark:border-indigo-900/40 rounded-[3rem] text-center bg-indigo-50/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block mb-4">One Last Thing</span>
          <p className="text-xl font-black text-slate-700 dark:text-slate-300 italic leading-relaxed max-w-2xl mx-auto">"{result.followUpQuestion}"</p>
        </section>

        {/* More Details (Optional) */}
        {result.moreDetails && (
          <div className="pt-8">
            <button 
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full text-center py-6 text-[11px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-3"
            >
              {showMoreDetails ? 'Hide Extra Details' : 'Show Extra Details'}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-500 ${showMoreDetails ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {showMoreDetails && (
              <div className="mt-6 p-10 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-[3rem] animate-in slide-in-from-top-6 duration-700 backdrop-blur-sm">
                 <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed whitespace-pre-wrap">{result.moreDetails}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ResultDisplay;
