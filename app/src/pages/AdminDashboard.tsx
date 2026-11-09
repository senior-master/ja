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

  // 🔐 REPLACE THIS WITH YOUR ADMIN EMAIL
  const ADMIN_EMAIL = "abdul01abdul03@gmail.com"; 

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/login'); // Kick out non-admins
      return;
    }

    const fetchData = async () => {
      // Fetch all results
      const { data: resData } = await supabase.from('user_results').select('*').order('created_at', { ascending: false });
      if (resData) setResults(resData);

      // Fetch all feedback
      const { data: feedData } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (feedData) setFeedback(feedData);

      // Fetch all reports
      const { data: repData } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (repData) setReports(repData);

      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Admin Data...</div>;

  // Calculate Stats
  const uniqueUsers = new Set(results.map(r => r.user_id)).size;
  const totalExams = results.length;
  const totalFeedback = feedback.length;
  const avgRating = totalFeedback > 0 
    ? (feedback.reduce((acc, f) => acc + f.rating, 0) / totalFeedback).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-4xl mx-auto">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform analytics & feedback</p>
        </div>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <Users className="text-blue-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-slate-800">{uniqueUsers}</span>
          <span className="text-xs text-slate-500 font-medium">Unique Users</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <MonitorPlay className="text-green-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-slate-800">{totalExams}</span>
          <span className="text-xs text-slate-500 font-medium">Exams Taken</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <MessageSquare className="text-purple-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-slate-800">{totalFeedback}</span>
          <span className="text-xs text-slate-500 font-medium">Feedback</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <Star className="text-yellow-500 mb-2 fill-yellow-500" size={24} />
          <span className="text-2xl font-bold text-slate-800">{avgRating}</span>
          <span className="text-xs text-slate-500 font-medium">Avg Rating</span>
        </div>
      </div>


      {/* Question Reports List */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="bg-red-500 p-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <AlertTriangle size={18} /> Reported Questions ({reports.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[40vh] overflow-y-auto">
          {reports.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">No reports yet. The questions are looking good!</p>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-red-600 dark:text-red-400">Question ID: {r.question_id}</span>
                  <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{r.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4">
          <h2 className="text-white font-bold">User Feedback</h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {feedback.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">No feedback yet.</p>
          ) : (
            feedback.map((f, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={14} className={idx < f.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                    ))}
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">{f.category}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {f.exam_mode}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{f.comment || <span className="italic text-slate-400">No comment provided</span>}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



