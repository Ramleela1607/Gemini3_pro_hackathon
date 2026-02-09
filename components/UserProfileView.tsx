
import React from 'react';
import { UserProfile, Category } from '../types';

interface UserProfileViewProps {
  profile: UserProfile;
  onClose: () => void;
  sessionMinutes?: number;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ profile, onClose, sessionMinutes = 0 }) => {
  // Fix: Explicitly cast Object.entries to [string, number][] to avoid 'unknown' errors in sort and arithmetic
  const topMisconceptions = (Object.entries(profile.misconceptionCounts) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Fix: Explicitly cast Object.entries to [string, number][] to avoid 'unknown' errors in reduce and arithmetic
  const categoryEntries = Object.entries(profile.categoryStats) as [string, number][];
  const totalByCategories = categoryEntries.reduce((acc, [, val]) => acc + val, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl shadow-indigo-500/20 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/20 to-white dark:to-slate-900">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Your Learning Journey</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Tracking breakthroughs since {new Date(profile.joinedDate).toLocaleDateString()}</p>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <p className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                Time spent this session: ~{sessionMinutes} minutes
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900 transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Analyzed', value: profile.totalDiagnostics, color: 'indigo' },
              { label: 'Learning Streak', value: `${profile.streak} Days`, color: 'emerald' },
              { label: 'Concepts Mastered', value: Object.keys(profile.misconceptionCounts).length, color: 'violet' },
              { label: 'Last Session', value: new Date(profile.lastActive).toLocaleDateString(), color: 'amber' }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-3xl bg-${stat.color}-50 dark:bg-${stat.color}-900/10 border border-${stat.color}-100 dark:border-${stat.color}-800 shadow-sm`}>
                <p className={`text-[10px] font-black text-${stat.color}-600 dark:text-${stat.color}-400 uppercase tracking-widest mb-1`}>{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Misconception Heatmap / List */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Top Growth Areas</h3>
              </div>
              <div className="space-y-4">
                {topMisconceptions.length > 0 ? topMisconceptions.map(([tag, count], i) => (
                  <div key={tag} className="flex items-center gap-4 group">
                    <div className="w-8 text-[10px] font-black text-slate-300 dark:text-slate-600">#{i+1}</div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between border border-transparent group-hover:border-rose-100 dark:group-hover:border-rose-800 group-hover:bg-rose-50/30 dark:group-hover:bg-rose-900/10 transition-all">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{tag}</span>
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500">{count} events</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4">No data patterns detected yet. Start analyzing mistakes!</p>
                )}
              </div>
            </section>

            {/* Subject Breakdown */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 18H20"/></svg>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Subject Focus</h3>
              </div>
              <div className="space-y-6">
                {categoryEntries.length > 0 ? categoryEntries.map(([cat, count]) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>{cat}</span>
                      {/* Fix: count and totalByCategories are now confirmed numbers through explicit casting */}
                      <span>{Math.round((count / totalByCategories) * 100)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(count / totalByCategories) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4">Submit your first problem to see your focus areas.</p>
                )}
              </div>
            </section>
          </div>

          {/* Progress Message */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-700 dark:to-violet-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-200 dark:shadow-black/40">
            <div className="relative z-10 max-w-lg">
              <h4 className="text-2xl font-black mb-4">You're making real progress.</h4>
              <p className="text-indigo-100 dark:text-indigo-200 font-medium leading-relaxed">
                By acknowledging your misconceptions, you're ahead of 90% of learners. 
                Keep analyzing, and these patterns will naturally start to fade as your intuition sharpens.
              </p>
            </div>
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 opacity-10 pointer-events-none scale-150">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1"><path d="M12 2v20M2 12h20"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
