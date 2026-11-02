import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ExamTimer } from '../components/ExamTimer';
import { QuestionCard } from '../components/QuestionCard';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

export function Runner() {
  const navigate = useNavigate();
  const {
    status, subjects, activeSubject, questions, currentIndexes,
    setActiveSubject, setCurrentIndex, submitExam, toggleFlag, flags
  } = useExamStore();

  useEffect(() => {
    if (status !== 'active') navigate('/');
  }, [status, navigate]);

  if (status !== 'active') return null;

  const currentQuestions = questions[activeSubject] || [];
  const currentIndex = currentIndexes[activeSubject] || 0;
  const currentQuestion = currentQuestions[currentIndex];
  
  if (!currentQuestion) return null;
  const isFlagged = flags.includes(currentQuestion.id);

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit your exam?")) {
      submitExam();
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-slate-700">CBT Master</div>
        <ExamTimer />
        <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          Submit
        </button>
      </header>

      <div className="bg-slate-800 text-white flex overflow-x-auto hide-scrollbar">
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeSubject === sub ? 'bg-blue-600' : 'hover:bg-slate-700'
            }`}
          >
            {sub.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>Question {currentIndex + 1} of {currentQuestions.length}</span>
          <button 
            onClick={() => toggleFlag(currentQuestion.id)}
            className={`flex items-center gap-1 ${isFlagged ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Flag size={16} fill={isFlagged ? "currentColor" : "none"} />
            {isFlagged ? 'Flagged' : 'Flag'}
          </button>
        </div>

        <QuestionCard question={currentQuestion} />

        <div className="flex gap-4 mt-2">
          <button 
            onClick={() => setCurrentIndex(activeSubject, currentIndex - 1)} 
            disabled={currentIndex === 0}
            className="flex-1 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <ChevronLeft size={20} /> Prev
          </button>
          <button 
            onClick={() => setCurrentIndex(activeSubject, currentIndex + 1)}
            disabled={currentIndex === currentQuestions.length - 1}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex justify-center items-center gap-2"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
