import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { supabase } from '../services/questions';
import { MathText } from '../components/MathText';
import { CONFIG } from '../config';
import { Star, MessageSquare, CheckCircle2, Home, Loader2 } from 'lucide-react';

export function Results() {
  const navigate = useNavigate();
  const { status, subjects, questions, answers, resetExam, examConfig, user } = useExamStore();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status !== 'submitted') navigate('/');
  }, [status, navigate]);

  if (status !== 'submitted') return null;

  const isCbt = examConfig?.mode === 'cbt';
  let totalScore = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  const subjectResults = subjects.map(sub => {
    const subQs = questions[sub] || [];
    let correct = 0;
    subQs.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    
    totalCorrect += correct;
    totalQuestions += subQs.length;

    const score = isCbt && subQs.length > 0 ? Math.round((correct / subQs.length) * 100) : correct;
    if (isCbt) totalScore += score;

    return { sub, correct, total: subQs.length, score };
  });

  const finalScore = isCbt ? totalScore : totalCorrect;
  const maxScore = isCbt ? subjects.length * 100 : totalQuestions;


  // ── CALCULATE TOPIC ANALYTICS ──
  const topicStats: Record<string, { correct: number; total: number }> = {};
  
  subjects.forEach(sub => {
    (questions[sub] || []).forEach(q => {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
      topicStats[q.topic].total += 1;
      if (answers[q.id] === q.correct_answer) {
        topicStats[q.topic].correct += 1;
      }
    });
  });

  const weakTopics = Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }))
    .filter(t => t.percentage < 50) // Only show topics below 50%
    .sort((a, b) => a.percentage - b.percentage);

  // ── SAVE EXAM RESULT TO DB ──
  useEffect(() => {
    if (user) {
      const saveResult = async () => {
        const cacheKey = `saved_${questions[subjects[0]]?.[0]?.id || 'exam'}`;
        if (sessionStorage.getItem(cacheKey)) return;

        // Save to DB and catch any RLS/Grant errors
        const { error } = await supabase.from('user_results').insert({
          user_id: user.id,
          mode: examConfig?.mode || 'cbt',
          score: finalScore,
          total_questions: totalQuestions,
          topic_breakdown: topicStats
        });

        if (error) {
          console.error("Save Result Error:", error);
          alert("Failed to save score to DB: " + error.message);
        } else {
          console.log("Score saved successfully!");
          sessionStorage.setItem(cacheKey, 'true');
        }
      };
      saveResult();
    }
  }, [user, examConfig, subjects, questions, finalScore, totalQuestions]);

  // ── SUBMIT FEEDBACK TO DB ──
  const handleFeedbackSubmit = async () => {
    if (rating === 0) return alert("Please select a star rating first.");
    if (!user) return alert("You must be logged in to submit feedback.");

    setIsSubmitting(true);
    
    try {
      // 1. Get the fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log out and log in again.");

      // 2. Raw fetch (Just like your analytics.js!)
      const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": CONFIG.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session.access_token}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          user_id: session.user.id,
          rating: Number(rating),
          category: category,
          comment: comment,
          exam_mode: examConfig?.mode || 'cbt'
        }),
      });

      // 3. Handle exact HTTP error if it fails
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      setFeedbackSubmitted(true);
    } catch (err: any) {
      alert("Database Error: " + err.message);
      console.error("Feedback Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    resetExam();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mt-4 mb-2">
        <h1 className="text-xl font-bold text-slate-800">Results</h1>
        <button onClick={handleGoHome} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Home size={16} /> Home
        </button>
      </header>

      {/* Score Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center mt-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
          {isCbt ? 'JAMB UTME Score' : 'Practice Score'}
        </h2>
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {finalScore} <span className="text-2xl text-slate-300">/ {maxScore}</span>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {totalCorrect} correct out of {totalQuestions} questions
        </p>
      </div>


      {/* Targeted Practice Analytics */}
      {weakTopics.length > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2">Areas for Improvement</h3>
          <p className="text-xs text-orange-700 mb-3">You scored below 50% in these topics. Practice them to improve your JAMB score!</p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map(t => (
              <div key={t.topic} className="bg-white border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                <span className="text-sm font-bold text-slate-700 capitalize">{t.topic}</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{t.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Grid */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Subject Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          {subjectResults.map(res => (
            <div key={res.sub} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="capitalize font-bold text-slate-700 text-sm truncate">{res.sub.replace(/-/g, ' ')}</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-xs text-slate-400">{res.correct}/{res.total}</span>
                <span className="font-bold text-blue-600">
                  {res.score}<span className="text-[10px] text-slate-400">/{isCbt ? 100 : res.total}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Corrections Review */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <details className="group">
          <summary className="p-4 font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
            <span>Review Incorrect Answers</span>
            <span className="text-xs text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-4 border-t border-slate-200 space-y-6">
            {subjects.map(sub => {
              const wrongQs = (questions[sub] || []).filter(q => answers[q.id] && answers[q.id] !== q.correct_answer);
              if (wrongQs.length === 0) return null;
              return (
                <div key={sub} className="space-y-4">
                  <h3 className="font-bold text-slate-700 capitalize border-b pb-1">{sub.replace(/-/g, ' ')}</h3>
                  {wrongQs.map(q => (
                    <div key={q.id} className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                      <div className="text-sm text-slate-800 font-medium mb-2">
                        <MathText text={q.question} />
                      </div>
                      <div className="text-xs mb-1">
                        <span className="font-bold text-red-600">Your answer: </span>
                        <MathText text={q[('option_' + answers[q.id].toLowerCase()) as keyof typeof q] as string} />
                      </div>
                      <div className="text-xs mb-2">
                        <span className="font-bold text-green-600">Correct answer: </span>
                        <MathText text={q[('option_' + q.correct_answer.toLowerCase()) as keyof typeof q] as string} />
                      </div>
                      {q.explanation && (
                        <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                          <span className="font-bold">Explanation: </span>
                          <MathText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {totalCorrect === totalQuestions && (
               <p className="text-center text-sm text-slate-500">You got everything right! No corrections to show.</p>
            )}
          </div>
        </details>
      </div>

      {/* Feedback Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-slate-300" />
          <h3 className="text-sm font-bold text-white">Give Feedback</h3>
        </div>
        
        {!feedbackSubmitted ? (
          <div className="p-5">
            <p className="text-sm text-slate-600 font-medium mb-4">
              How do you feel about the app? Any complaints, suggestions, or bugs to report?
            </p>

            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={`${
                      (hoverRating || rating) >= star 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-slate-300'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
              {['General', 'Suggestion', 'Bug Report'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                    category === cat 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think or how we can improve..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 mb-4"
            />

            <button
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Submit Feedback'}
            </button>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={48} className="text-green-500 mb-3" />
            <h4 className="font-bold text-slate-800">Thank you!</h4>
            <p className="text-sm text-slate-500 mt-1">Your feedback has been securely saved.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
          >
            Take Another Exam
          </button>
        </div>
      </div>
    </div>
  );
}
