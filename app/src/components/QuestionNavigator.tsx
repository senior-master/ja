import { useExamStore } from '../store/useExamStore';

export function QuestionNavigator() {
  const {
    activeSubject, questions, currentIndexes, setCurrentIndex,
    answers, flags, isReviewOpen, setIsCatchingSkips
  } = useExamStore();

  if (isReviewOpen) return null;

  const currentQs = questions[activeSubject] || [];
  const answeredCount = currentQs.filter(q => !!answers[q.id]).length;
  const flaggedCount = currentQs.filter(q => flags.includes(q.id)).length;

  const handleJump = (idx: number) => {
    setCurrentIndex(activeSubject, idx);
    setIsCatchingSkips(false);
  };

  return (
    <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-900 border-t-4 lg:border-t-0 lg:border-l-4 border-slate-200 dark:border-slate-700 flex flex-col h-[30vh] lg:h-auto overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shadow-sm z-10">
        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Question Palette</span>
        <div className="flex gap-2 text-xs font-bold">
          <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded border border-green-200 dark:border-green-800">A: {answeredCount}</span>
          <span className="text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">F: {flaggedCount}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 lg:grid-cols-4 gap-2 content-start">
        {currentQs.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flags.includes(q.id);
          const isCurrent = currentIndexes[activeSubject] === idx;

          let btnClass = "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300";
          if (isAnswered) btnClass = "bg-green-500 border-green-600 text-white";
          if (isFlagged) btnClass = "bg-orange-400 border-orange-500 text-white";
          if (isCurrent) btnClass += " ring-2 ring-blue-600 ring-offset-1 dark:ring-offset-slate-900 border-blue-600";

          return (
            <button
              key={q.id}
              onClick={() => handleJump(idx)}
              className={`h-9 rounded shadow-sm border font-bold text-sm flex items-center justify-center transition-all ${btnClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
