import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchSubjects, fetchExamQuestions } from '../services/questions';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

export function LearningSetup() {
  const navigate = useNavigate();
  const { startExam, resetExam, examMode } = useExamStore();
  
  const [subjects, setSubjects] = useState<{subject_slug: string, total: number}[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [qCount, setQCount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examMode !== 'learning') navigate('/');
    resetExam();
    fetchSubjects().then(setSubjects).catch(console.error);
  }, [resetExam, examMode, navigate]);

  const toggleSubject = (slug: string) => {
    if (selected.includes(slug)) setSelected(selected.filter(s => s !== slug));
    else if (selected.length < 4) setSelected([...selected, slug]);
  };

  const handleStart = async () => {
    if (selected.length === 0 || !qCount) return;
    setLoading(true);
    try {
      const questions: Record<string, any[]> = {};
      for (const sub of selected) {
        const fetched = await fetchExamQuestions([sub]); 
        questions[sub] = fetched[sub].slice(0, qCount); 
      }
      
      startExam(selected, questions, { mode: 'learning', timeLimit: null, showAnswers: 'instant' });
      navigate('/runner');
    } catch (err) {
      alert("Failed to load questions. Check connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 pb-32">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Learning Mode Setup</h1>
          <p className="text-slate-500 text-sm">Instant feedback & explanations</p>
        </div>
      </header>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">1. Select Subjects (Max 4)</h2>
        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {subjects.map(sub => {
            const isSelected = selected.includes(sub.subject_slug);
            return (
              <button
                key={sub.subject_slug}
                onClick={() => toggleSubject(sub.subject_slug)}
                className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                  isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="font-bold text-slate-800 text-xs capitalize pr-5 truncate">
                  {sub.subject_slug.replace(/-/g, ' ')}
                </div>
                <div className="absolute top-3 right-3 text-purple-600">
                  {isSelected ? <CheckCircle2 size={18} className="fill-purple-100"/> : <Circle size={18} className="text-slate-300"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">2. Questions per Subject</h2>
        <input 
          type="number" 
          placeholder="e.g. 20"
          value={qCount}
          onChange={e => setQCount(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg"
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 block">TOTAL QUESTIONS</span>
            <span className="font-bold text-slate-800 text-lg">{selected.length * (Number(qCount) || 0)}</span>
          </div>
          <button
            onClick={handleStart}
            disabled={selected.length === 0 || !qCount || loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Learning'}
          </button>
        </div>
      </div>
    </div>
  );
}
