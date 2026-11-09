import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { supabase } from '../services/questions';
import { ArrowLeft, Users, MonitorPlay, MessageSquare, Star, AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useExamStore();
  
  const [results, setResults] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "abdul01abdul03@gmail.com";

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      const { data: resData } = await supabase.from('user_results').select('*').order('created_at', { ascending: false });
      if (resData) setResults(resData);

      const { data: feedData } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (feedData) setFeedback(feedData);

      const { data: repData } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (repData) setReports(repData);

      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  if (loading) return <div className="min-h-screen bg-[#09090b] text-zinc-500 flex items-center justify-center">Loading Admin Data...</div>;

  const uniqueUsers = new Set(results.map(r => r.user_id)).size;
  const totalExams = results.length;
  const totalFeedback = feedback.length;
  const avgRating = totalFeedback > 0 
    ? (feedback.reduce((acc, f) => acc + f.rating, 0) / totalFeedback).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-[#09090b] p-4 pb-24 max-w-4xl mx-auto text-zinc-200">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/login')} className="p-2 bg-zinc-900 rounded-full shadow-sm border border-zinc-800 text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">Platform analytics & feedback</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex flex-col items-center justify-center">
          <Users className="text-amber-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-white">{uniqueUsers}</span>
          <span className="text-xs text-zinc-500 font-medium">Unique Users</span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex flex-col items-center justify-center">
          <MonitorPlay className="text-amber-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-white">{totalExams}</span>
          <span className="text-xs text-zinc-500 font-medium">Exams Taken</span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex flex-col items-center justify-center">
          <MessageSquare className="text-amber-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-white">{totalFeedback}</span>
          <span className="text-xs text-zinc-500 font-medium">Feedback</span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex flex-col items-center justify-center">
          <Star className="text-amber-500 mb-2 fill-amber-500" size={24} />
          <span className="text-2xl font-bold text-white">{avgRating}</span>
          <span className="text-xs text-zinc-500 font-medium">Avg Rating</span>
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 rounded-xl shadow-sm border border-red-500/20 overflow-hidden">
        <div className="bg-zinc-950 border-b border-zinc-800 p-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Reported Questions ({reports.length})
          </h2>
        </div>
        <div className="divide-y divide-zinc-800 max-h-[40vh] overflow-y-auto">
          {reports.length === 0 ? (
            <p className="p-6 text-center text-zinc-500 text-sm">No reports yet. The questions are looking good!</p>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-red-400">Question ID: {r.question_id}</span>
                  <span className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium">{r.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
        <div className="bg-zinc-950 border-b border-zinc-800 p-4">
          <h2 className="text-white font-bold">User Feedback</h2>
        </div>
        <div className="divide-y divide-zinc-800 max-h-[60vh] overflow-y-auto">
          {feedback.length === 0 ? (
            <p className="p-6 text-center text-zinc-500 text-sm">No feedback yet.</p>
          ) : (
            feedback.map((f, i) => (
              <div key={i} className="p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={14} className={idx < f.rating ? "fill-amber-500 text-amber-500" : "text-zinc-700"} />
                    ))}
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 uppercase tracking-wider">{f.category}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {f.exam_mode}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{f.comment || <span className="italic text-zinc-600">No comment provided</span>}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
