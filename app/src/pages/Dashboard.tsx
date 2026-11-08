import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchUserHistory } from '../services/questions';
import { ArrowLeft, Trophy, Clock, BookOpen, MonitorPlay, GraduationCap } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useExamStore();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchUserHistory(user.id)
      .then(data => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const getModeIcon = (mode: string) => {
    if (mode === 'cbt') return <MonitorPlay size={16} className="text-green-600" />;
    if (mode === 'practice') return <BookOpen size={16} className="text-blue-600" />;
    return <GraduationCap size={16} className="text-purple-600" />;
  };

  const getModeName = (mode: string) => {
    if (mode === 'cbt') return 'Real Exam (CBT)';
    if (mode === 'practice') return 'Practice Mode';
    return 'Learning Mode';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Dashboard</h1>
          <p className="text-slate-500 text-sm">Your progress history</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-700">No exams taken yet</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Take your first test to start tracking your progress.</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            Start Practicing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((result, idx) => (
            <div key={result.id || idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getModeIcon(result.mode)}
                  <span className="font-bold text-slate-800 text-sm">{getModeName(result.mode)}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(result.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-xl text-blue-600">{result.score}</div>
                <div className="text-xs text-slate-400">out of {result.total_questions}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
