
import React from 'react';

interface HeaderProps {
  onShowProfile: () => void;
  onReset: () => void;
  diagnosticCount?: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onShowProfile, 
  onReset,
  diagnosticCount = 0, 
  isDarkMode, 
  toggleDarkMode,
  userName
}) => {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight leading-none">
              Explain-My-Mistake
            </h1>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">⚡ Powered by Gemini 3</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest hidden sm:inline">|</span>
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest hidden sm:inline">Human-Centered AI Tutor</span>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all shadow-sm active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <button 
            onClick={onReset}
            className="w-10 h-10 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full hover:bg-rose-100 transition-all shadow-sm active:scale-95 group"
            title="Start fresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-[-120deg] transition-transform duration-500"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          
          <button 
            onClick={onShowProfile}
            className="group flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all shadow-sm active:scale-95"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {diagnosticCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-xs font-bold tracking-tight hidden sm:inline">
              {userName ? `${userName}'s Journey` : 'Journey'}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
