import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ExamTimer } from '../components/ExamTimer';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { ReviewModal } from '../components/ReviewModal';
import { Calculator } from '../components/Calculator';
import { ChevronLeft, ChevronRight, Flag, Calculator as CalcIcon, CheckCircle2 } from 'lucide-react';

export function Runner() {
  const navigate = useNavigate();
  const {
    status, subjects, activeSubject, questions, currentIndexes,
    setActiveSubject, setCurrentIndex, toggleFlag, toggleReview, flags,
    isCalculatorOpen, toggleCalculator, setAnswer, candidateInfo, answers,
    isCatchingSkips, setIsCatchingSkips
  } = useExamStore();

  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (status === 'submitted') navigate('/results', { replace: true });
    else if (status !== 'active') navigate('/');
  }, [status, navigate]);

  const currentQuestions = questions[activeSubject] || [];
  const currentIndex = currentIndexes[activeSubject] || 0;
  const currentQuestion = currentQuestions[currentIndex];
  const isFlagged = currentQuestion ? flags.includes(currentQuestion.id) : false;

  const totalQuestions = subjects.reduce((acc, sub) => acc + (questions[sub]?.length || 0), 0);
  const answeredCount = Object.keys(answers).length;
  const hasSkipped = answeredCount < totalQuestions;
  
  const isAtAbsoluteEnd = activeSubject === subjects[subjects.length - 1] && 
                          currentIndex === currentQuestions.length - 1;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const minRequired = Math.ceil(totalQuestions / 2);

  const handleSubmitClick = () => {
    if (answeredCount < minRequired) {
      showToast(`You must answer at least ${minRequired} questions to submit.`);
      return;
    }
    toggleReview();
    setIsCatchingSkips(false);
  };

  const handleNext = () => {
    if (isCatchingSkips || isAtAbsoluteEnd) {
      let targetSub = '';
      let targetIndex = -1;

      for (let s = subjects.indexOf(activeSubject); s < subjects.length; s++) {
        const sub = subjects[s];
        const subQs = questions[sub] || [];
        for (let i = 0; i < subQs.length; i++) {
          if (s === subjects.indexOf(activeSubject) && i <= currentIndex) continue;
          if (!answers[subQs[i].id]) {
            targetSub = sub; targetIndex = i; break;
          }
        }
        if (targetSub) break;
      }

      if (!targetSub) {
        for (let s = 0; s <= subjects.indexOf(activeSubject); s++) {
          const sub = subjects[s];
          const subQs = questions[sub] || [];
          for (let i = 0; i < subQs.length; i++) {
            if (s === subjects.indexOf(activeSubject) && i >= currentIndex) break;
            if (!answers[subQs[i].id]) {
              targetSub = sub; targetIndex = i; break;
            }
          }
          if (targetSub) break;
        }
      }

      if (targetSub !== '') {
        setActiveSubject(targetSub);
        setCurrentIndex(targetSub, targetIndex);
        setIsCatchingSkips(true);
        showToast("Jumped to next unanswered question");
      } else {
        handleSubmitClick();
        setIsCatchingSkips(false);
      }
      return;
    }

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(activeSubject, currentIndex + 1);
    } else {
      const currentSubIndex = subjects.indexOf(activeSubject);
      if (currentSubIndex < subjects.length - 1) {
        setActiveSubject(subjects[currentSubIndex + 1]);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(activeSubject, currentIndex - 1);
    } else {
      const currentSubIndex = subjects.indexOf(activeSubject);
      if (currentSubIndex > 0) {
        const prevSub = subjects[currentSubIndex - 1];
        setActiveSubject(prevSub);
        const prevSubQs = questions[prevSub] || [];
        setCurrentIndex(prevSub, prevSubQs.length - 1);
      }
    }
    setIsCatchingSkips(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion || status !== 'active' || document.activeElement?.tagName === 'INPUT') return;
      const key = e.key.toUpperCase();
      
      if (['A', 'B', 'C', 'D'].includes(key)) setAnswer(currentQuestion.id, key);
      else if (key === 'N') handleNext();
      else if (key === 'P') handlePrev();
      else if (key === 'R') toggleFlag(currentQuestion.id);
      else if (key === 'S') handleSubmitClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (status !== 'active' || !currentQuestion) return null;

  const isFinished = isAtAbsoluteEnd && !hasSkipped;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans relative transition-colors">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce font-medium text-sm">
          {toastMsg}
        </div>
      )}

      <header className="bg-green-700 dark:bg-green-900 text-white px-4 py-2 flex flex-wrap justify-between items-center shadow-md z-20">
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">CBT Master</span>
          <span className="text-xs text-green-200">{candidateInfo.name} | {candidateInfo.regNo}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleCalculator} className="p-2 bg-green-800 hover:bg-green-600 dark:bg-green-950 dark:hover:bg-green-800 rounded text-white shadow-inner" title="Calculator">
            <CalcIcon size={20} />
          </button>
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1 rounded font-mono font-bold shadow-inner">
            <ExamTimer />
          </div>
          <button onClick={handleSubmitClick} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow transition-colors">
            Submit
          </button>
        </div>
      </header>

      <div className="bg-green-800 dark:bg-green-950 text-green-100 flex overflow-x-auto hide-scrollbar shadow-inner z-10">
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => { setActiveSubject(sub); setIsCatchingSkips(false); }}
            className={`px-6 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-4 ${
              activeSubject === sub ? 'bg-green-600 dark:bg-green-800 border-yellow-400 text-white font-bold' : 'border-transparent hover:bg-green-700 dark:hover:bg-green-900'
            }`}
          >
            {sub.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1400px] w-full mx-auto">
        <main className="flex-1 flex flex-col p-4 overflow-y-auto">
          <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 mb-2 bg-white dark:bg-slate-800 p-2 rounded shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="font-bold">Question {currentIndex + 1} of {currentQuestions.length}</span>
            <span className="text-xs font-bold text-slate-400">| Answered: {answeredCount}/{totalQuestions}</span>
            <button 
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`flex items-center gap-1 font-medium px-2 py-1 rounded ${isFlagged ? 'text-white bg-orange-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Flag size={16} /> {isFlagged ? 'Flagged' : 'Flag (R)'}
            </button>
          </div>

          <div className="flex-1 mb-4">
            <QuestionCard question={currentQuestion} />
          </div>

          <div className="flex gap-4 mt-auto">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0 && activeSubject === subjects[0]}
              className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={20} /> Prev (P)
            </button>
            
            {isFinished ? (
              <button 
                onClick={handleSubmitClick}
                className="flex-1 py-3 bg-yellow-500 text-slate-900 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg"
              >
                <CheckCircle2 size={20} /> Finish Exam
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="flex-1 py-3 bg-green-700 dark:bg-green-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-600 dark:hover:bg-green-500 transition-colors shadow-lg"
              >
                Next (N) <ChevronRight size={20} />
              </button>
            )}
          </div>
        </main>

        <QuestionNavigator />
      </div>

      <ReviewModal />
      {isCalculatorOpen && <Calculator onClose={toggleCalculator} />}
    </div>
  );
}
