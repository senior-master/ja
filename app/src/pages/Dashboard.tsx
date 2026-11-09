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
    if (mode === 'cbt') return <MonitorPlay size={16} className="text-green-600" />;
    if (mode === 'practice') return <BookOpen size={16} className="text-blue-600" />;
    return <GraduationCap size={16} className="text-purple-600" />;
  };

  const getModeName = (mode: string) => {
    if (mode === 'cbt') return 'Real Exam (CBT)';
    if (mode === 'practice') return 'Practice Mode';
    return 'Learning Mode';
  };

  // ── AGGREGATE WEAK TOPICS ACROSS ALL EXAMS ──
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
    .filter(t => t.percentage < 60 && t.total >= 3) // Only topics under 60% with at least 3 questions seen
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5); // Top 5 weakest

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24 max-w-2xl mx-auto transition-colors">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Dashboard</h1>
          <p className="text-slate-500 text-sm">Your progress history</p>
        </div>
      </header>

      {/* Global Weakness Radar */}
      {!loading && globalWeakTopics.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-orange-500 p-3 flex items-center gap-2">
            <Trophy size={16} className="text-white" />
            <h2 className="text-sm font-bold text-white">Your Weakest Topics</h2>
          </div>
          <div className="p-4 space-y-4">
            {globalWeakTopics.map(t => (
              <div key={t.topic}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-200 capitalize">{t.topic}</span>
                  <span className="text-orange-600">{t.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${t.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-700 dark:text-white">No exams taken yet</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Take your first test to start tracking your progress.</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            Start Practicing
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Recent Exams</h2>
          <div className="space-y-3">
            {history.map((result, idx) => (
              <div key={result.id || idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getModeIcon(result.mode)}
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{getModeName(result.mode)}</span>
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
        </div>
      )}
    </div>
  );
}
