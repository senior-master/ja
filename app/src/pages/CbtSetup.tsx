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
    if (examMode !== 'cbt') navigate('/login');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-32 max-w-2xl mx-auto transition-colors">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">CBT Master Setup</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Select 3 subjects + English (Locked)</p>
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
                isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300'
              } ${isEnglish ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className={`font-bold text-sm capitalize pr-6 ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {sub.subject_slug.replace(/-/g, ' ')}
              </div>
              <div className="text-xs text-slate-500 mt-1">{sub.total} questions</div>
              <div className={`absolute top-4 right-4 ${isSelected ? 'text-green-600' : 'text-slate-300'}`}>
                {isSelected ? <CheckCircle2 size={20} className="fill-green-100 dark:fill-green-900"/> : <Circle size={20} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 block">SELECTED</span>
            <span className="font-bold text-slate-800 dark:text-white text-lg">{selected.length}/4 Subjects</span>
          </div>
          <button
            onClick={handleStart}
            disabled={selected.length !== 4 || loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Loading...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
