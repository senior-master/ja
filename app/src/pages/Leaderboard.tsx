import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/questions';
import { ArrowLeft, Medal } from 'lucide-react';

export function Leaderboard() {
  const navigate = useNavigate();
  const [topScores, setTopScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopScores = async () => {
      // Fetch top 10 CBT scores with user profiles
      const { data, error } = await supabase
        .from('user_results')
        .select(`
          score,
          total_questions,
          created_at,
          mode,
          profiles ( full_name )
        `)
        .order('score', { ascending: false })
        .limit(20); // Fetch top 20 to see if practice scores exist
        
      if (error) {
        console.error("Leaderboard fetch error:", error);
      } else if (data) {
        // Only show CBT scores, but if there are none, we know why!
        const cbtOnly = data.filter(d => d.mode === 'cbt');
        setTopScores(cbtOnly);
      }
      setLoading(false);
    };
    fetchTopScores();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leaderboard</h1>
          <p className="text-slate-500 text-sm">Top 10 CBT Scores of all time</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading rankings...</div>
      ) : topScores.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Medal size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No CBT Master exams taken yet.</p>
          <p className="text-xs text-slate-400 mt-1">Practice and Learning modes don't appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {topScores.map((row, index) => (
            <div key={index} className={`flex items-center p-4 border-b border-slate-100 last:border-0 ${index === 0 ? 'bg-yellow-50/50' : index === 1 ? 'bg-slate-50/50' : index === 2 ? 'bg-orange-50/30' : ''}`}>
              <div className="w-10 text-center font-bold text-lg text-slate-400 flex justify-center">
                {index === 0 ? <Medal className="text-yellow-500" size={24} /> : 
                 index === 1 ? <Medal className="text-slate-400" size={24} /> : 
                 index === 2 ? <Medal className="text-orange-400" size={24} /> : 
                 `#${index + 1}`}
              </div>
              <div className="flex-1 ml-2">
                <div className="font-bold text-slate-800 capitalize truncate">
                  {row.profiles?.full_name || "Anonymous Student"}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-blue-600">{row.score}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">/ {row.total_questions}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
