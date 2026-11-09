import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { supabase } from '../services/questions';
import { ArrowLeft, Users, MonitorPlay, MessageSquare, Star, AlertTriangle, X, Save, Loader2 } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useExamStore();
  
  const [results, setResults] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ADMIN_EMAIL = "abdul01abdul03@gmail.com";

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: resData } = await supabase.from('user_results').select('*').order('created_at', { ascending: false });
    if (resData) setResults(resData);

    const { data: feedData } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (feedData) setFeedback(feedData);

    const { data: repData } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (repData) setReports(repData);

    setLoading(false);
  };

  const handleEditReport = async (report: any) => {
    // Fetch the actual question data
    const { data, error } = await supabase.from('questions').select('*').eq('id', report.question_id).single();
    if (data) {
      setEditingQuestion({ ...data, report_id: report.id });
    } else {
      alert("Could not find this question. It may have been deleted.");
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    setIsSaving(true);

    try {
      // 1. Update the question
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          question: editingQuestion.question,
          option_a: editingQuestion.option_a,
          option_b: editingQuestion.option_b,
          option_c: editingQuestion.option_c,
          option_d: editingQuestion.option_d,
          correct_answer: editingQuestion.correct_answer,
          explanation: editingQuestion.explanation
        })
        .eq('id', editingQuestion.id);

      if (updateError) throw updateError;

      // 2. Delete the report
      const { error: deleteError } = await supabase.from('reports').delete().eq('id', editingQuestion.report_id);
      if (deleteError) throw deleteError;

      alert("✅ Question updated and report cleared!");
      setEditingQuestion(null);
      fetchData(); // Refresh the list
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
          <p className="text-zinc-500 text-sm">Platform analytics & quality control</p>
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
              <div key={i} className="p-4 hover:bg-zinc-800/50 transition-colors flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm text-red-400 block mb-1">Question ID: {r.question_id}</span>
                  <p className="text-sm text-zinc-300 font-medium">{r.reason}</p>
                </div>
                <button 
                  onClick={() => handleEditReport(r)}
                  className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/20"
                >
                  Fix Question
                </button>
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
          {feedback.map((f, i) => (
            <div key={i} className="p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} className={idx < f.rating ? "fill-amber-500 text-amber-500" : "text-zinc-700"} />
                  ))}
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(f.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
              <p className="text-sm text-zinc-300">{f.comment || <span className="italic text-zinc-600">No comment</span>}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-zinc-950 p-4 flex justify-between items-center border-b border-zinc-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Fixing Question #{editingQuestion.id}
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Question Text</label>
                <textarea 
                  value={editingQuestion.question} 
                  onChange={e => setEditingQuestion({...editingQuestion, question: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white h-24 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {['a', 'b', 'c', 'd'].map(letter => (
                  <div key={letter}>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Option {letter.toUpperCase()}</label>
                    <input 
                      type="text" 
                      value={editingQuestion[`option_${letter}`]} 
                      onChange={e => setEditingQuestion({...editingQuestion, [`option_${letter}`]: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Correct Answer</label>
                  <select 
                    value={editingQuestion.correct_answer}
                    onChange={e => setEditingQuestion({...editingQuestion, correct_answer: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Subject</label>
                  <input type="text" disabled value={editingQuestion.subject_slug} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Explanation</label>
                <textarea 
                  value={editingQuestion.explanation || ''} 
                  onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white h-20 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
              <button onClick={() => setEditingQuestion(null)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700">Cancel</button>
              <button onClick={handleSaveQuestion} disabled={isSaving} className="flex-1 py-2 bg-amber-500 text-black rounded-lg font-bold hover:bg-amber-400 flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save & Clear Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
