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
      navigate('/login');
      return;
    }

    fetchUserHistory(user.id)
      .then(data => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const getModeIcon = (mode: string) => {
    if (mode === 'cbt') return <MonitorPlay size={16} className="text-amber-500" />;
    if (mode === 'practice') return <BookOpen size={16} className="text-amber-500" />;
    return <GraduationCap size={16} className="text-amber-500" />;
  };

  const getModeName = (mode: string) => {
    if (mode === 'cbt') return 'Real Exam (CBT)';
    if (mode === 'practice') return 'Practice Mode';
    return 'Learning Mode';
  };

  const globalTopicStats: Record<string, { correct: number; total: number }> = {};
  
  history.forEach(result => {
    if (result.topic_breakdown) {
      Object.entries(result.topic_breakdown).forEach(([topic, stats]: [string, any]) => {
        if (!globalTopicStats[topic]) globalTopicStats[topic] = { correct: 0, total: 0 };
        globalTopicStats[topic].correct += stats.correct;
        globalTopicStats[topic].total += stats.total;
      });
    }
  });

  const globalWeakTopics = Object.entries(globalTopicStats)
    .map(([topic, stats]) => ({
      topic,
      percentage: Math.round((stats.correct / stats.total) * 100),
      total: stats.total
    }))
    .filter(t => t.percentage < 60 && t.total >= 3)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#09090b] p-4 pb-24 max-w-2xl mx-auto text-zinc-200">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/login')} className="p-2 bg-zinc-900 rounded-full shadow-sm border border-zinc-800 text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">My Dashboard</h1>
          <p className="text-zinc-500 text-sm">Your progress history</p>
        </div>
      </header>

      {!loading && globalWeakTopics.length > 0 && (
        <div className="mb-6 bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-950 border-b border-zinc-800 p-3 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-white">Your Weakest Topics</h2>
          </div>
          <div className="p-4 space-y-4">
            {globalWeakTopics.map(t => (
              <div key={t.topic}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-200 capitalize">{t.topic}</span>
                  <span className="text-amber-500">{t.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${t.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-zinc-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-800 text-center">
          <Trophy size={48} className="mx-auto text-zinc-700 mb-4" />
          <h2 className="text-lg font-bold text-white">No exams taken yet</h2>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Take your first test to start tracking your progress.</p>
          <button onClick={() => navigate('/login')} className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-amber-400">
            Start Practicing
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Recent Exams</h2>
          <div className="space-y-3">
            {history.map((result, idx) => (
              <div key={result.id || idx} className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getModeIcon(result.mode)}
                    <span className="font-bold text-white text-sm">{getModeName(result.mode)}</span>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(result.created_at).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-xl text-amber-500">{result.score}</div>
                  <div className="text-xs text-zinc-500">out of {result.total_questions}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
