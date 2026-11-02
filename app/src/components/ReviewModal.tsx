import { useExamStore } from '../store/useExamStore';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export function ReviewModal() {
  const navigate = useNavigate();
  const {
    isReviewOpen, toggleReview, subjects, questions,
    answers, flags, submitExam
  } = useExamStore();

  if (!isReviewOpen) return null;

  const totalQs = subjects.reduce((acc, sub) => acc + (questions[sub]?.length || 0), 0);
  const answeredQs = Object.keys(answers).length;
  const unansweredQs = totalQs - answeredQs;
  const flaggedQs = flags.length;

  const handleFinalSubmit = () => {
    if (unansweredQs > 0) {
      if (!window.confirm(`You still have ${unansweredQs} unanswered questions. Are you sure you want to submit?`)) return;
    }
    submitExam();
    navigate('/results');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Review & Submit</h2>
          <button onClick={toggleReview} className="p-2 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Total Questions</span>
              <span className="font-bold">{totalQs}</span>
            </div>
            <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100 text-green-700">
              <span className="font-medium">Answered</span>
              <span className="font-bold">{answeredQs}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100 text-red-700">
              <span className="font-medium">Unanswered</span>
              <span className="font-bold">{unansweredQs}</span>
            </div>
            <div className="flex justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 text-orange-700">
              <span className="font-medium">Flagged</span>
              <span className="font-bold">{flaggedQs}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={handleFinalSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-green-200">
              Confirm & Submit
            </button>
            <button onClick={toggleReview} className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50">
              Continue Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
