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
  
  // Sticky row logic
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

  // Observer to detect if the user's row is in the viewport
  useEffect(() => {
    if (!userRowRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsUserVisible(entry.isIntersecting),
      { threshold: 0.5 } // Consider visible if 50% of the row is shown
    );
    
    observer.observe(userRowRef.current);
    return () => observer.disconnect();
  }, [topScores]);

  const userRankIndex = topScores.findIndex(r => r.user_id === user?.id);
  const userData = userRankIndex !== -1 ? topScores[userRankIndex] : null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-32 max-w-2xl mx-auto">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leaderboard</h1>
          <p className="text-slate-500 text-sm">Top 100 CBT Scores</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading rankings...</div>
      ) : topScores.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Medal size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No CBT Master exams taken yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {topScores.map((row, index) => {
            const isMe = row.user_id === user?.id;
            return (
              <div 
                key={index} 
                ref={isMe ? userRowRef : null}
                className={`flex items-center p-4 border-b border-slate-100 last:border-0 transition-colors ${isMe ? 'bg-blue-50' : index === 0 ? 'bg-yellow-50/50' : index === 1 ? 'bg-slate-50/50' : index === 2 ? 'bg-orange-50/30' : ''}`}
              >
                <div className="w-10 text-center font-bold text-lg text-slate-400 flex justify-center">
                  {index === 0 ? <Medal className="text-yellow-500" size={24} /> : 
                   index === 1 ? <Medal className="text-slate-400" size={24} /> : 
                   index === 2 ? <Medal className="text-orange-400" size={24} /> : 
                   `#${index + 1}`}
                </div>
                <div className="flex-1 ml-2">
                  <div className="font-bold text-slate-800 capitalize truncate flex items-center gap-2">
                    {isMe ? "You" : (row.full_name || "Anonymous Student")}
                    {isMe && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">Me</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-blue-600">{row.score}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">/ 400</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky User Row (Shows only if user is on the list, but not currently visible on screen) */}
      {userData && !isUserVisible && (
        <div className="fixed bottom-6 left-0 right-0 px-4 max-w-2xl mx-auto z-50">
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between border-2 border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                #{userRankIndex + 1}
              </div>
              <div>
                <div className="font-bold text-sm">You</div>
                <div className="text-[10px] text-slate-400">Your current rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-blue-400">{userData.score}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">/ 400</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
