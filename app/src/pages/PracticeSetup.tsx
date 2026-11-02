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
    if (examMode !== 'practice') navigate('/');
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
    <div className="min-h-screen max-w-2xl mx-auto p-4 pb-32">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Practice Setup</h1>
          <p className="text-slate-500 text-sm">Customize your practice session</p>
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
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-bold text-slate-800 text-xs capitalize pr-5 truncate">
                  {sub.subject_slug.replace(/-/g, ' ')}
                </div>
                <div className="absolute top-3 right-3 text-blue-600">
                  {isSelected ? <CheckCircle2 size={18} className="fill-blue-100"/> : <Circle size={18} className="text-slate-300"/>}
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
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
        />
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">3. Time Limit (Minutes)</h2>
        <p className="text-xs text-slate-400 mb-2">Leave blank for no timer</p>
        <input 
          type="number" 
          placeholder="e.g. 45"
          value={timeMins}
          onChange={e => setTimeMins(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Practice'}
          </button>
        </div>
      </div>
    </div>
  );
}
