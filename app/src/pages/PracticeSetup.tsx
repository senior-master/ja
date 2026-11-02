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
  const [qCount, setQCount] = useState(20); // Questions per subject
  const [timeMode, setTimeMode] = useState<'none' | 'total' | 'per_q'>('none');
  const [totalMins, setTotalMins] = useState(30);
  const [secsPerQ, setSecsPerQ] = useState(60);
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
    if (selected.length === 0) return;
    setLoading(true);
    try {
      // Fetch custom number of questions per subject
      const questions: Record<string, any[]> = {};
      for (const sub of selected) {
        // We modify fetchExamQuestions to accept a count
        // For now, we'll just slice the 40 that come back
        const fetched = await fetchExamQuestions([sub]); 
        questions[sub] = fetched[sub].slice(0, qCount); 
      }
      
      // Calculate time limit in milliseconds
      let timeLimit: number | null = null;
      if (timeMode === 'total') timeLimit = totalMins * 60 * 1000;
      if (timeMode === 'per_q') timeLimit = secsPerQ * qCount * selected.length * 1000;

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
        <div className="flex gap-2">
          {[10, 20, 40].map(n => (
            <button
              key={n} onClick={() => setQCount(n)}
              className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${qCount === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600'}`}
            >
              {n} Qs
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">3. Timing</h2>
        <div className="flex gap-2 mb-4">
          {[
            { id: 'none', label: 'No Timer' },
            { id: 'total', label: 'Total Mins' },
            { id: 'per_q', label: 'Secs / Question' }
          ].map(m => (
            <button
              key={m.id} onClick={() => setTimeMode(m.id as any)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs border-2 transition-colors ${timeMode === m.id ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-200 text-slate-600'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {timeMode === 'total' && (
          <div className="flex items-center gap-3">
            <input type="range" min="5" max="120" step="5" value={totalMins} onChange={e => setTotalMins(Number(e.target.value))} className="flex-1" />
            <span className="font-bold text-slate-800 w-16 text-right">{totalMins} mins</span>
          </div>
        )}
        {timeMode === 'per_q' && (
          <div className="flex items-center gap-3">
            <input type="range" min="15" max="120" step="15" value={secsPerQ} onChange={e => setSecsPerQ(Number(e.target.value))} className="flex-1" />
            <span className="font-bold text-slate-800 w-16 text-right">{secsPerQ} secs</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 block">TOTAL QUESTIONS</span>
            <span className="font-bold text-slate-800 text-lg">{selected.length * qCount}</span>
          </div>
          <button
            onClick={handleStart}
            disabled={selected.length === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Practice'}
          </button>
        </div>
      </div>
    </div>
  );
}
