import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';

export function Results() {
  const navigate = useNavigate();
  const { status, subjects, questions, answers, resetExam } = useExamStore();

  useEffect(() => {
    if (status !== 'submitted') navigate('/');
  }, [status, navigate]);

  if (status !== 'submitted') return null;

  let totalScore = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  const subjectResults = subjects.map(sub => {
    const subQs = questions[sub] || [];
    let correct = 0;
    subQs.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    
    // JAMB Scoring: Each subject is scaled to 100
    const score = subQs.length > 0 ? Math.round((correct / subQs.length) * 100) : 0;
    totalScore += score;
    totalCorrect += correct;
    totalQuestions += subQs.length;

    return { sub, correct, total: subQs.length, score };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-8">
        <h2 className="text-slate-500 font-medium mb-2">JAMB UTME Score</h2>
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {totalScore} <span className="text-3xl text-slate-400">/ 400</span>
        </div>
        <p className="text-slate-400">{totalCorrect} out of {totalQuestions} correct answers</p>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-slate-700 mb-4 text-lg">Subject Breakdown</h3>
        <div className="flex flex-col gap-3">
          {subjectResults.map(res => (
            <div key={res.sub} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <span className="capitalize font-bold text-slate-700">{res.sub.replace(/-/g, ' ')}</span>
                <div className="text-xs text-slate-400">{res.correct} correct out of {res.total}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg text-blue-600">{res.score}</span>
                <span className="text-sm text-slate-400"> / 100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => { resetExam(); navigate('/'); }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-colors"
          >
            Take Another Exam
          </button>
        </div>
      </div>
    </div>
  );
}
