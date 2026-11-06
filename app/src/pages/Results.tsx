import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { Star, MessageSquare, CheckCircle2, Home } from 'lucide-react';
import { supabase } from '../services/questions';

export function Results() {
  const navigate = useNavigate();
  const { status, subjects, questions, answers, resetExam, candidateInfo, examConfig, user } = useExamStore();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

    // CBT scales to 100 per subject. Practice/Learning shows raw score.
    const score = isCbt && subQs.length > 0 ? Math.round((correct / subQs.length) * 100) : correct;
    if (isCbt) totalScore += score;

    return { sub, correct, total: subQs.length, score };
  });

  const finalScore = isCbt ? totalScore : totalCorrect;
  const maxScore = isCbt ? subjects.length * 100 : totalQuestions;


  useEffect(() => {
    if (status === 'submitted' && user) {
      const saveResult = async () => {
        // Prevent duplicate saves on strict mode re-renders
        const cacheKey = `saved_${questions[subjects[0]]?.[0]?.id || 'exam'}`;
        if (sessionStorage.getItem(cacheKey)) return;

        await supabase.from('user_results').insert({
          user_id: user.id,
          mode: examConfig?.mode || 'cbt',
          score: finalScore,
          total_questions: totalQuestions
        });
        
        sessionStorage.setItem(cacheKey, 'true');
      };
      
      // We need to wait a tiny bit for the variables to compute
      setTimeout(saveResult, 500);
    }
  }, [status, user, examConfig, subjects, questions, finalScore, totalQuestions]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0 || !user) return;
    
    setFeedbackSubmitted(true); // Optimistic UI update
    
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      rating,
      category,
      comment,
      exam_mode: examConfig?.mode || 'cbt'
    });

    if (error) {
      console.error("Error saving feedback:", error);
      alert("Failed to save feedback. Please check your connection.");
      setFeedbackSubmitted(false); // Revert on failure
    }
  };

  const handleGoHome = () => {
    resetExam();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      
      {/* Header with Home Button */}
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
              disabled={rating === 0}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
            >
              Submit Feedback
            </button>
            {rating === 0 && <p className="text-xs text-center text-red-500 mt-2">Please select a star rating first</p>}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={48} className="text-green-500 mb-3" />
            <h4 className="font-bold text-slate-800">Thank you!</h4>
            <p className="text-sm text-slate-500 mt-1">Your feedback helps us improve CBT Master.</p>
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
