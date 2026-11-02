import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ExamTimer } from '../components/ExamTimer';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { Calculator } from '../components/Calculator';
import { ChevronLeft, ChevronRight, Flag, Calculator as CalcIcon } from 'lucide-react';

export function Runner() {
  const navigate = useNavigate();
  const {
    status, subjects, activeSubject, questions, currentIndexes,
    setActiveSubject, setCurrentIndex, toggleFlag, toggleReview, flags,
    isCalculatorOpen, toggleCalculator, setAnswer, candidateInfo
  } = useExamStore();

  useEffect(() => {
    if (status !== 'active') navigate('/');
  }, [status, navigate]);

  const currentQuestions = questions[activeSubject] || [];
  const currentIndex = currentIndexes[activeSubject] || 0;
  const currentQuestion = currentQuestions[currentIndex];
  const isFlagged = currentQuestion ? flags.includes(currentQuestion.id) : false;

  // JAMB 8-Key Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion || status !== 'active') return;
      const key = e.key.toUpperCase();
      
      // A, B, C, D for options
      if (['A', 'B', 'C', 'D'].includes(key)) {
        setAnswer(currentQuestion.id, key);
      } 
      // N for Next
      else if (key === 'N') {
        if (currentIndex < currentQuestions.length - 1) setCurrentIndex(activeSubject, currentIndex + 1);
      } 
      // P for Previous
      else if (key === 'P') {
        if (currentIndex > 0) setCurrentIndex(activeSubject, currentIndex - 1);
      } 
      // R for Return/Flag
      else if (key === 'R') {
        toggleFlag(currentQuestion.id);
      } 
      // S for Submit
      else if (key === 'S') {
        toggleReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentIndex, activeSubject, currentQuestions.length, status, setAnswer, setCurrentIndex, toggleFlag, toggleReview]);

  if (status !== 'active' || !currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Green Header (JAMB Style) */}
      <header className="bg-green-700 text-white px-4 py-2 flex flex-wrap justify-between items-center shadow-md z-20">
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">CBT Master</span>
          <span className="text-xs text-green-200">{candidateInfo.name} | {candidateInfo.regNo}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleCalculator} className="p-2 bg-green-800 hover:bg-green-600 rounded text-white shadow-inner" title="Calculator">
            <CalcIcon size={20} />
          </button>
          <div className="bg-white text-slate-800 px-3 py-1 rounded font-mono font-bold shadow-inner">
            <ExamTimer />
          </div>
          <button onClick={toggleReview} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow transition-colors">
            Submit
          </button>
        </div>
      </header>

      {/* Subject Tabs */}
      <div className="bg-green-800 text-green-100 flex overflow-x-auto hide-scrollbar shadow-inner z-10">
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-6 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-4 ${
              activeSubject === sub ? 'bg-green-600 border-yellow-400 text-white font-bold' : 'border-transparent hover:bg-green-700'
            }`}
          >
            {sub.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Main Layout: Question Area + Permanent Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1400px] w-full mx-auto">
        
        {/* Left Side: Question */}
        <main className="flex-1 flex flex-col p-4 overflow-y-auto">
          <div className="flex justify-between items-center text-sm text-slate-600 mb-2 bg-white p-2 rounded shadow-sm border border-slate-200">
            <span className="font-bold">Question {currentIndex + 1} of {currentQuestions.length}</span>
            <button 
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`flex items-center gap-1 font-medium px-2 py-1 rounded ${isFlagged ? 'text-white bg-orange-500' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Flag size={16} /> {isFlagged ? 'Flagged' : 'Flag (R)'}
            </button>
          </div>

          <div className="flex-1 mb-4">
            <QuestionCard question={currentQuestion} />
          </div>

          <div className="flex gap-4 mt-auto">
            <button 
              onClick={() => setCurrentIndex(activeSubject, currentIndex - 1)} 
              disabled={currentIndex === 0}
              className="flex-1 py-3 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-700 disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={20} /> Prev (P)
            </button>
            <button 
              onClick={() => setCurrentIndex(activeSubject, currentIndex + 1)}
              disabled={currentIndex === currentQuestions.length - 1}
              className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-green-600 transition-colors shadow-lg"
            >
              Next (N) <ChevronRight size={20} />
            </button>
          </div>
        </main>

        {/* Right/Bottom Side: Permanent Navigator */}
        <QuestionNavigator />
      </div>

      {/* Calculator Popup */}
      {isCalculatorOpen && <Calculator onClose={toggleCalculator} />}
    </div>
  );
}
