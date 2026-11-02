import { useExamStore } from '../store/useExamStore';
import { X, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuestionNavigator() {
  const navigate = useNavigate();
  const {
    isNavigatorOpen, toggleNavigator, isReviewOpen, toggleReview,
    subjects, activeSubject, questions, currentIndexes, setCurrentIndex,
    answers, flags, submitExam
  } = useExamStore();

  if (!isNavigatorOpen && !isReviewOpen) return null;

  const currentQs = questions[activeSubject] || [];
  
  // Calculate stats for Review Modal
  const totalQs = subjects.reduce((acc, sub) => acc + (questions[sub]?.length || 0), 0);
  const answeredQs = Object.keys(answers).length;
  const unansweredQs = totalQs - answeredQs;
  const flaggedQs = flags.length;

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(activeSubject, index);
    toggleNavigator();
  };

  const handleFinalSubmit = () => {
    submitExam();
    navigate('/results');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end flex-col sm:flex-row">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={isReviewOpen ? toggleReview : toggleNavigator}></div>

      {/* Slide-up Drawer (Mobile) / Side Panel (Desktop) */}
      <div className="bg-white w-full sm:w-96 h-[80vh] sm:h-full rounded-t-2xl sm:rounded-none flex flex-col shadow-2xl animate-slide-up sm:animate-slide-left">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isReviewOpen ? 'Review & Submit' : 'Question Navigator'}
          </h2>
          <button onClick={isReviewOpen ? toggleReview : toggleNavigator} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        {!isReviewOpen ? (
          /* NAVIGATOR GRID */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex gap-4 mb-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Answered</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Flagged</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 border border-slate-300 rounded-sm"></div> Empty</div>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {currentQs.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flags.includes(q.id);
                const isCurrent = currentIndexes[activeSubject] === idx;

                let btnClass = "bg-slate-50 border-slate-200 text-slate-600";
                if (isAnswered) btnClass = "bg-green-500 border-green-600 text-white";
                if (isFlagged) btnClass = "bg-orange-400 border-orange-500 text-white";
                
                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-12 rounded-lg border-2 font-bold flex items-center justify-center relative ${btnClass} ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    {idx + 1}
                    {isFlagged && <Flag size={10} className="absolute top-1 right-1 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* REVIEW SCREEN */
          <div className="flex-1 p-6 flex flex-col">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Total Questions</span>
                <span className="font-bold">{totalQs}</span>
              </div>
              <div className="flex justify-between p-4 bg-green-50 rounded-lg text-green-700">
                <span>Answered</span>
                <span className="font-bold">{answeredQs}</span>
              </div>
              <div className="flex justify-between p-4 bg-orange-50 rounded-lg text-orange-700">
                <span>Unanswered</span>
                <span className="font-bold">{unansweredQs}</span>
              </div>
              <div className="flex justify-between p-4 bg-yellow-50 rounded-lg text-yellow-700">
                <span>Flagged for review</span>
                <span className="font-bold">{flaggedQs}</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center mb-auto">
              Are you sure you want to submit? You cannot change your answers after this.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button onClick={handleFinalSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-green-200">
                Confirm & Submit
              </button>
              <button onClick={toggleReview} className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold">
                Continue Exam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
