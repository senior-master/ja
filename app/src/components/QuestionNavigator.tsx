import { useExamStore } from '../store/useExamStore';
import { useNavigate } from 'react-router-dom';

export function QuestionNavigator() {
  const navigate = useNavigate();
  const {
    activeSubject, subjects, questions, currentIndexes, setCurrentIndex,
    answers, flags, isReviewOpen, toggleReview
  } = useExamStore();

  if (isReviewOpen) return null; // Hide navigator when review modal is open

  const currentQs = questions[activeSubject] || [];
  
  const answeredCount = currentQs.filter(q => !!answers[q.id]).length;
  const flaggedCount = currentQs.filter(q => flags.includes(q.id)).length;

  return (
    <div className="w-full lg:w-80 bg-slate-50 lg:bg-white border-t-4 lg:border-t-0 lg:border-l-4 border-slate-200 flex flex-col h-[30vh] lg:h-auto overflow-hidden">
      {/* Header Stats */}
      <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
        <span className="font-bold text-sm text-slate-700">Question Palette</span>
        <div className="flex gap-2 text-xs font-bold">
          <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">A: {answeredCount}</span>
          <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200">F: {flaggedCount}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 lg:grid-cols-4 gap-2 content-start">
        {currentQs.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flags.includes(q.id);
          const isCurrent = currentIndexes[activeSubject] === idx;

          let btnClass = "bg-slate-200 border-slate-300 text-slate-600"; // Unanswered (Grey)
          if (isAnswered) btnClass = "bg-green-500 border-green-600 text-white"; // Answered (Green)
          if (isFlagged) btnClass = "bg-orange-400 border-orange-500 text-white"; // Flagged (Orange)
          if (isCurrent) btnClass += " ring-2 ring-blue-600 ring-offset-1 border-blue-600"; // Current (Blue ring)

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(activeSubject, idx)}
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
