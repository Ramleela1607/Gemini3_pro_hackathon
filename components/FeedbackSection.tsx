
import React, { useState } from 'react';

const FeedbackSection: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      setSubmittedFeedback(true);
      setFeedback('');
    }
  };

  return (
    <section className="mt-20 p-8 md:p-12 glass-card rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Share Your Thoughts</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">How can we improve your learning journey?</p>
        </div>
      </div>

      {!submittedFeedback ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you liked or how we can improve..."
            className="w-full min-h-[120px] text-sm font-medium"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="px-8 py-3 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-105 disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 animate-in zoom-in-95 duration-500 text-center py-6">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">Thank you!</p>
          <div className="inline-block px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            Feedback Received
          </div>
          <div>
            <button
              onClick={() => setSubmittedFeedback(false)}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline pt-4"
            >
              Send more feedback
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeedbackSection;
