import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchSubjects, fetchExamQuestions } from '../services/questions';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

export function PracticeSetup() {
  const navigate = useNavigate();
  const { startExam, resetExam, examMode } = useExamStore();
  
  const [subjects, setSubjects] = useState<{subject_slug: string, total: number}[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [qCount, setQCount] = useState<number | ''>('');
  const [timeMins, setTimeMins] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examMode !== 'practice') navigate('/login');
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
      const timeLimit = timeMins ? timeMins * 60 * 1000 : null;
      startExam(selected, questions, { mode: 'practice', timeLimit, showAnswers: 'end' });
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
          <h1 className="text-xl font-bold text-white">Practice Setup</h1>
          <p className="text-zinc-500 text-sm">Customize your session</p>
        </div>
      </header>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-zinc-500 uppercase mb-3">1. Select Subjects (Max 4)</h2>
        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {subjects.map(sub => {
            const isSelected = selected.includes(sub.subject_slug);
            return (
              <button
                key={sub.subject_slug}
                onClick={() => toggleSubject(sub.subject_slug)}
                className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                  isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-amber-500/50'
                }`}
              >
                <div className={`font-bold text-xs capitalize pr-5 truncate ${isSelected ? 'text-amber-500' : 'text-white'}`}>
                  {sub.subject_slug.replace(/-/g, ' ')}
                </div>
                <div className={`absolute top-3 right-3 ${isSelected ? 'text-amber-500' : 'text-zinc-600'}`}>
                  {isSelected ? <CheckCircle2 size={18} className="fill-amber-500/20"/> : <Circle size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-500 uppercase mb-3">2. Questions per Subject</h2>
        <input 
          type="number" placeholder="e.g. 20" value={qCount}
          onChange={e => setQCount(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg text-white placeholder-zinc-600"
        />
      </div>

      <div className="mb-6 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-500 uppercase mb-3">3. Time Limit (Minutes)</h2>
        <p className="text-xs text-zinc-500 mb-2">Leave blank for no timer</p>
        <input 
          type="number" placeholder="e.g. 45" value={timeMins}
          onChange={e => setTimeMins(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg text-white placeholder-zinc-600"
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-zinc-500 block">TOTAL QUESTIONS</span>
            <span className="font-bold text-white text-lg">{selected.length * (Number(qCount) || 0)}</span>
          </div>
          <button
            onClick={handleStart} disabled={selected.length === 0 || !qCount || loading}
            className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Loading...' : 'Start Practice'}
          </button>
        </div>
      </div>
    </div>
  );
}
