import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchSubjects, fetchExamQuestions } from '../services/questions';
import { CheckCircle2, Circle } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const startExam = useExamStore(state => state.startExam);
  const resetExam = useExamStore(state => state.resetExam);
  
  const [subjects, setSubjects] = useState<{subject_slug: string, total: number}[]>([]);
  const [selected, setSelected] = useState<string[]>(['english-language']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resetExam(); // Clear previous exam on load
    fetchSubjects().then(setSubjects).catch(console.error);
  }, [resetExam]);

  const toggleSubject = (slug: string) => {
    if (slug === 'english-language') return; // Locked
    if (selected.includes(slug)) setSelected(selected.filter(s => s !== slug));
    else if (selected.length < 4) setSelected([...selected, slug]);
  };

  const handleStart = async () => {
    if (selected.length !== 4) return;
    setLoading(true);
    try {
      const questions = await fetchExamQuestions(selected);
      startExam(selected, questions);
      navigate('/runner');
    } catch (err) {
      alert("Failed to load questions. Check connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 pb-24">
      <header className="mb-8 mt-4 text-center">
        <h1 className="text-3xl font-bold text-slate-800">CBT Master</h1>
        <p className="text-slate-500">Select 3 subjects + English to begin</p>
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
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'
              } ${isEnglish ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-slate-800 text-sm capitalize">
                {sub.subject_slug.replace(/-/g, ' ')}
              </div>
              <div className="text-xs text-slate-500 mt-1">{sub.total} questions</div>
              <div className="absolute top-4 right-4 text-blue-500">
                {isSelected ? <CheckCircle2 size={20} className="fill-blue-100"/> : <Circle size={20} className="text-slate-300"/>}
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
