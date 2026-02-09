
import React, { useState, useEffect } from 'react';
import { AgeGroup, UserProfile } from '../types';

interface PersonalizationModalProps {
  onSave: (name: string, age: AgeGroup, consent: boolean) => void;
  existingProfile?: UserProfile;
}

const PersonalizationModal: React.FC<PersonalizationModalProps> = ({ onSave, existingProfile }) => {
  const [name, setName] = useState(existingProfile?.userName || '');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>(existingProfile?.ageGroup || '');
  const [parentalConsent, setParentalConsent] = useState(existingProfile?.parentalConsent || false);
  const ageGroups: AgeGroup[] = ['6–9', '10–12', '13–15', '16–17', '18+'];

  const isChildGroup = ageGroup === '6–9' || ageGroup === '10–12';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && ageGroup) {
      onSave(name.trim(), ageGroup, isChildGroup ? parentalConsent : true);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-700 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-10 md:p-14 space-y-10 shadow-2xl border border-white/10 my-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {existingProfile ? `Welcome Back, ${existingProfile.userName}!` : 'Access Request'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {existingProfile 
              ? 'Please confirm your profile details to enter this learning session.' 
              : 'Tell me a bit about yourself so I can coach you better.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Preferred Name (Nickname Only)</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex"
              className="w-full"
            />
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                <span className="uppercase font-black block mb-1">Privacy Check</span>
                Please do <span className="underline italic">not</span> provide your full legal name or any personal identifiers. Nicknames only!
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Your Age Group</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ageGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setAgeGroup(group)}
                  className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                    ageGroup === group 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {isChildGroup && (
            <div className="p-6 bg-sky-50 dark:bg-sky-950/20 border-2 border-sky-100 dark:border-sky-900/50 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h4 className="text-[11px] font-black text-sky-800 dark:text-sky-400 uppercase tracking-widest">Parental Guidance</h4>
               </div>
               <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium leading-relaxed">
                  We care about child safety. In Kids Mode, we limit responses to safe educational guidance and never request contact info.
               </p>
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${parentalConsent ? 'bg-sky-600 border-sky-600' : 'border-sky-200 group-hover:border-sky-400 bg-white'}`}>
                    {parentalConsent && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={parentalConsent}
                    onChange={(e) => setParentalConsent(e.target.checked)}
                  />
                  <span className="text-xs font-black text-sky-800 dark:text-sky-300 uppercase tracking-tight">I am a parent or guardian and I give consent.</span>
               </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={!name.trim() || !ageGroup || (isChildGroup && !parentalConsent)}
            className="w-full py-6 bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {existingProfile ? 'Enter Learning Session' : 'Start Learning'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PersonalizationModal;
