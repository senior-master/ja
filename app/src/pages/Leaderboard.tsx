import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/questions';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, Medal } from 'lucide-react';

export function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useExamStore();
  const [topScores, setTopScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userRowRef = useRef<HTMLDivElement>(null);
  const [isUserVisible, setIsUserVisible] = useState(false);

  useEffect(() => {
    const fetchTopScores = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      if (!error && data) setTopScores(data);
      setLoading(false);
    };
    fetchTopScores();
  }, []);

  useEffect(() => {
    if (!userRowRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsUserVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(userRowRef.current);
    return () => observer.disconnect();
  }, [topScores]);

  const userRankIndex = topScores.findIndex(r => r.user_id === user?.id);
  const userData = userRankIndex !== -1 ? topScores[userRankIndex] : null;

  return (
    <div className="min-h-screen bg-[#09090b] p-4 pb-32 max-w-2xl mx-auto text-zinc-200">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/login')} className="p-2 bg-zinc-900 rounded-full shadow-sm border border-zinc-800 text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Leaderboard</h1>
          <p className="text-zinc-500 text-sm">Top 100 CBT Scores</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-zinc-500">Loading rankings...</div>
      ) : topScores.length === 0 ? (
        <div className="text-center py-10 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
          <Medal size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">No CBT Master exams taken yet.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
          {topScores.map((row, index) => {
            const isMe = row.user_id === user?.id;
            return (
              <div 
                key={index} 
                ref={isMe ? userRowRef : null}
                className={`flex items-center p-4 border-b border-zinc-800 last:border-0 transition-colors ${isMe ? 'bg-amber-500/10' : 'hover:bg-zinc-800/50'}`}
              >
                <div className="w-10 text-center font-bold text-lg text-zinc-500 flex justify-center">
                  {index === 0 ? <Medal className="text-amber-500" size={24} /> : 
                   index === 1 ? <Medal className="text-zinc-400" size={24} /> : 
                   index === 2 ? <Medal className="text-orange-400" size={24} /> : 
                   `#${index + 1}`}
                </div>
                <div className="flex-1 ml-2">
                  <div className="font-bold text-white capitalize truncate flex items-center gap-2">
                    {isMe ? "You" : (row.full_name || "Anonymous Student")}
                    {isMe && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Me</span>}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-amber-500">{row.score}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">/ {row.total_questions}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {userData && !isUserVisible && (
        <div className="fixed bottom-6 left-0 right-0 px-4 max-w-2xl mx-auto z-50">
          <div className="bg-zinc-950 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold">
                #{userRankIndex + 1}
              </div>
              <div>
                <div className="font-bold text-sm text-white">You</div>
                <div className="text-[10px] text-zinc-500">Your current rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-amber-500">{userData.score}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">/ {userData.total_questions}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
