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
    <div className="min-h-screen bg-[#09090b] p-4 pb-32 max-w-2xl mx-auto text-zinc-200">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/login')} className="p-2 bg-zinc-900 rounded-full shadow-sm border border-zinc-800 text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">CBT Master Setup</h1>
          <p className="text-zinc-500 text-sm">Select 3 subjects + English (Locked)</p>
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
                isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-amber-500/50'
              } ${isEnglish ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className={`font-bold text-sm capitalize pr-6 ${isSelected ? 'text-amber-500' : 'text-white'}`}>
                {sub.subject_slug.replace(/-/g, ' ')}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{sub.total} questions</div>
              <div className={`absolute top-4 right-4 ${isSelected ? 'text-amber-500' : 'text-zinc-600'}`}>
                {isSelected ? <CheckCircle2 size={20} className="fill-amber-500/20"/> : <Circle size={20} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-zinc-500 block">SELECTED</span>
            <span className="font-bold text-white text-lg">{selected.length}/4 Subjects</span>
          </div>
          <button
            onClick={handleStart}
            disabled={selected.length !== 4 || loading}
            className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Loading...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
