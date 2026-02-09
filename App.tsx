
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultDisplay from './components/ResultDisplay';
import UserProfileView from './components/UserProfileView';
import PersonalizationModal from './components/PersonalizationModal';
import FeedbackSection from './components/FeedbackSection';
import { Category, MistakeEntry, AnalysisResult, UserProfile, LearningMode, AccessibilityPreference, AgeGroup } from './types';
import { analyzeMistake } from './services/geminiService';

const PROFILE_KEY = 'emm_user_profile_v1';
const HISTORY_KEY = 'emm_diagnostic_history_v1';
const THEME_KEY = 'emm_theme_mode';

const INITIAL_PROFILE: UserProfile = {
  totalDiagnostics: 0,
  misconceptionCounts: {},
  categoryStats: {},
  lastActive: Date.now(),
  joinedDate: Date.now(),
  streak: 0
};

const App: React.FC = () => {
  const [category, setCategory] = useState<Category>(Category.AUTO);
  const [learningMode, setLearningMode] = useState<LearningMode>(LearningMode.STANDARD);
  const [accPreference, setAccPreference] = useState<AccessibilityPreference | undefined>(undefined);
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('Auto');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MistakeEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSetup, setShowSetup] = useState(true); // Always show setup on load/refresh
  const [sessionStarted, setSessionStarted] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [sessionInteractions, setSessionInteractions] = useState(0);

  useEffect(() => {
    // 1. Initial Load: Load saved profile but keep Setup Modal visible as an "Access Request"
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setUserProfile(parsed);
      
      const isChild = parsed.ageGroup === '6–9' || parsed.ageGroup === '10–12';
      if (isChild) {
        setLearningMode(LearningMode.KIDS);
      } else if (parsed.ageGroup && parsed.ageGroup !== '6–9' && parsed.ageGroup !== '10–12') {
        if (learningMode === LearningMode.KIDS) setLearningMode(LearningMode.STANDARD);
      }
    }

    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const handleReset = () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    setUserProfile(INITIAL_PROFILE);
    setHistory([]);
    setQuestion('');
    setStudentAnswer('');
    setCorrectAnswer('');
    setImagePreview(null);
    setCurrentResult(null);
    setAccPreference(undefined);
    setLearningMode(LearningMode.STANDARD);
    setError(null);
    
    // Reset session stats
    setSessionStartTime(Date.now());
    setSessionInteractions(0);
    setSessionStarted(false);
    
    setResetMessage("Okay! Let’s start fresh.");
    setShowSetup(true);
    
    setTimeout(() => setResetMessage(null), 4000);
  };

  const handleSavePersonalization = (name: string, age: AgeGroup, consent: boolean) => {
    const isChild = age === '6–9' || age === '10–12';
    setUserProfile(prev => ({ ...prev, userName: name, ageGroup: age, parentalConsent: consent }));
    
    if (isChild) {
      setLearningMode(LearningMode.KIDS);
    } else {
      setLearningMode(LearningMode.STANDARD);
    }
    
    setShowSetup(false);
    setSessionStarted(true);
  };

  const handleAnalyze = async (manualCategory?: Category) => {
    setIsLoading(true);
    setError(null);
    setCurrentResult(null);

    try {
      const base64Image = imagePreview?.split(',')[1];
      const previousTags = history.map(h => h.analysis?.misconceptionTag).filter((tag): tag is string => !!tag);
      const isFirstSessionResponse = history.length === 0;

      const result = await analyzeMistake(
        manualCategory || category, 
        question, 
        studentAnswer, 
        outputLanguage, 
        learningMode,
        correctAnswer, 
        base64Image,
        previousTags,
        accPreference,
        userProfile.userName,
        userProfile.ageGroup,
        userProfile.parentalConsent,
        isFirstSessionResponse
      );
      
      const detectedCat = (result.detectedCategory as Category) || Category.GENERAL;
      setCategory(detectedCat);
      setCurrentResult(result);
      
      const newEntry: MistakeEntry = {
        id: crypto.randomUUID(),
        category: detectedCat,
        question,
        studentAnswer,
        correctAnswer: correctAnswer || undefined,
        imagePreview: imagePreview || undefined,
        outputLanguage,
        learningMode,
        accessibilityPreference: accPreference,
        analysis: result,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 15));
      setSessionInteractions(s => s + 1);

      setUserProfile(prev => {
        const nextMisconceptions = { ...prev.misconceptionCounts };
        const tag = result.misconceptionTag || 'Unspecified';
        nextMisconceptions[tag] = (nextMisconceptions[tag] || 0) + 1;
        const nextCategories = { ...prev.categoryStats };
        nextCategories[detectedCat] = (nextCategories[detectedCat] || 0) + 1;
        return {
          ...prev,
          totalDiagnostics: prev.totalDiagnostics + 1,
          misconceptionCounts: nextMisconceptions,
          categoryStats: nextCategories,
          lastActive: Date.now()
        };
      });

    } catch (err: any) {
      setError(err.message || 'The learning coach encountered an unexpected error.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (entry: MistakeEntry) => {
    const isChild = userProfile.ageGroup === '6–9' || userProfile.ageGroup === '10–12';
    setCategory(entry.category);
    if (isChild) {
      setLearningMode(LearningMode.KIDS);
    } else {
      setLearningMode(entry.learningMode === LearningMode.KIDS ? LearningMode.STANDARD : entry.learningMode);
    }
    setAccPreference(entry.accessibilityPreference);
    setQuestion(entry.question);
    setStudentAnswer(entry.studentAnswer);
    setCorrectAnswer(entry.correctAnswer || '');
    setOutputLanguage(entry.outputLanguage || 'Auto');
    setImagePreview(entry.imagePreview || null);
    setCurrentResult(entry.analysis || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Heuristic time estimate: use either actual elapsed minutes or the number of interactions (at least 1 min per turn)
  const sessionElapsedMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
  const estimatedSessionMinutes = Math.max(sessionElapsedMinutes, sessionInteractions);

  const themeColor = learningMode === LearningMode.KIDS ? 'amber' : (learningMode === LearningMode.ACCESSIBILITY ? 'sky' : 'indigo');

  return (
    <div className="min-h-screen pb-20 dark:text-slate-100 transition-colors duration-500">
      {/* 
          Access Request Gate: Always present on load. 
          The main app is hidden or blurred until sessionStarted is true.
      */}
      {showSetup && (
        <PersonalizationModal 
          onSave={handleSavePersonalization} 
          existingProfile={userProfile.userName ? userProfile : undefined}
        />
      )}

      <div className={`${!sessionStarted ? 'blur-2xl pointer-events-none opacity-40 scale-95 overflow-hidden h-screen' : 'transition-all duration-1000'}`}>
        <Header 
          onShowProfile={() => setShowProfile(true)} 
          onReset={handleReset}
          diagnosticCount={userProfile.totalDiagnostics}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          userName={userProfile.userName}
        />
        
        {resetMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-top fade-in duration-500">
            <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 border-2 border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {resetMessage}
            </div>
          </div>
        )}

        {showProfile && (
          <UserProfileView 
            profile={userProfile} 
            onClose={() => setShowProfile(false)} 
            sessionMinutes={estimatedSessionMinutes}
          />
        )}

        <main className="max-w-5xl mx-auto px-4 mt-24 md:mt-36 relative z-10">
          <div className="text-center mb-24 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 glass-card rounded-full text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] shadow-xl">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse bg-${themeColor}-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]`} />
              Adaptive {learningMode === LearningMode.KIDS ? 'Junior' : (learningMode === LearningMode.ACCESSIBILITY ? 'Accessible' : 'Neural')} Diagnostic
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.95]">
              {userProfile.userName ? `Welcome, ${userProfile.userName}` : 'Learning'} <br className="hidden md:block"/>
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400`}>
                {learningMode === LearningMode.KIDS ? 'Super Fun!' : 'Breakthrough.'}
              </span>
            </h2>
          </div>

          <div className={`glass-card app-card overflow-hidden transition-all duration-700`}>
            <InputSection
              category={category}
              setCategory={setCategory}
              learningMode={learningMode}
              setLearningMode={setLearningMode}
              accPreference={accPreference}
              setAccPreference={setAccPreference}
              question={question}
              setQuestion={setQuestion}
              studentAnswer={studentAnswer}
              setStudentAnswer={setStudentAnswer}
              correctAnswer={correctAnswer}
              setCorrectAnswer={setCorrectAnswer}
              outputLanguage={outputLanguage}
              setOutputLanguage={setOutputLanguage}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              onAnalyze={() => handleAnalyze()}
              isLoading={isLoading}
              ageGroup={userProfile.ageGroup}
              parentalConsent={userProfile.parentalConsent}
            />
          </div>

          {error && (
            <div className="mt-8 p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-[2.5rem] flex items-center gap-6 shadow-2xl animate-in fade-in zoom-in-95 text-center">
              <p className="font-bold text-sm mx-auto">{error}</p>
            </div>
          )}

          {currentResult && (
            <div className={`mt-20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3.5rem] shadow-2xl p-2 border border-${themeColor}-100 dark:border-${themeColor}-900/30 animate-in fade-in slide-in-from-bottom-16`}>
              <ResultDisplay 
                result={currentResult} 
                learningMode={learningMode} 
                userName={userProfile.userName} 
              />
            </div>
          )}

          <FeedbackSection />

          {history.length > 0 && (
            <div className="mt-48 pt-24 border-t border-slate-200/40 dark:border-slate-800/40">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] mb-16 text-center">Learning Archive</h3>
              <div className="grid sm:grid-cols-2 gap-8">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => loadFromHistory(entry)}
                    className={`group text-left p-12 glass-card rounded-[3rem] border-2 border-transparent hover:border-indigo-400/50 dark:hover:border-indigo-600/50 hover:scale-[1.03] hover:shadow-2xl transition-all duration-500
                      ${entry.learningMode === LearningMode.KIDS ? 'hover:border-amber-400/50' : ''}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 inline-block">
                      {entry.category}
                    </span>
                    <p className="text-2xl font-black line-clamp-1 text-slate-900 dark:text-white">{entry.analysis?.misconceptionTag || 'Diagnostic Session'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-3 font-medium leading-relaxed">{entry.question}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
