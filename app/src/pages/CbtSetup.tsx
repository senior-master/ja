import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchSubjects, fetchExamQuestions } from '../services/questions';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';

export function CbtSetup() {
  const navigate = useNavigate();
  const { startExam, resetExam, examMode } = useExamStore();
  
  const [subjects, setSubjects] = useState<{subject_slug: string, total: number}[]>([]);
  const [selected, setSelected] = useState<string[]>(['english-language']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examMode !== 'cbt') navigate('/');
    resetExam();
    fetchSubjects().then(setSubjects).catch(console.error);
  }, [resetExam, examMode, navigate]);

  const toggleSubject = (slug: string) => {
    if (slug === 'english-language') return;
    if (selected.includes(slug)) setSelected(selected.filter(s => s !== slug));
    else if (selected.length < 4) setSelected([...selected, slug]);
  };

  const handleStart = async () => {
    if (selected.length !== 4) return;
    setLoading(true);
    try {
      const questions = await fetchExamQuestions(selected);
      startExam(selected, questions, { mode: 'cbt', timeLimit: 120 * 60 * 1000, showAnswers: 'end' });
      navigate('/runner');
    } catch (err) {
      alert("Failed to load questions. Check connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 pb-24">
      <header className="mb-8 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">CBT Setup</h1>
          <p className="text-slate-500 text-sm">Select 3 subjects + English</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {subjects.map(sub => {
          const isSelected = selected.includes(sub.subject_slug);
          const isEnglish = sub.subject_slug === 'english-language';
          return (
            <button
              key={sub.subject_slug}
              onClick={() => toggleSubject(sub.subject_slug)}
              disabled={isEnglish}
              className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                isSelected ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-green-300'
              } ${isEnglish ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-slate-800 text-sm capitalize pr-6">
                {sub.subject_slug.replace(/-/g, ' ')}
              </div>
              <div className="text-xs text-slate-500 mt-1">{sub.total} questions</div>
              <div className="absolute top-4 right-4 text-green-600">
                {isSelected ? <CheckCircle2 size={20} className="fill-green-100"/> : <Circle size={20} className="text-slate-300"/>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">{selected.length}/4 Subjects</span>
          <button
            onClick={handleStart}
            disabled={selected.length !== 4 || loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
