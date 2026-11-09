import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { fetchSubjects, fetchTopics, fetchTopicQuestions } from '../services/questions';
import { ArrowLeft, CheckCircle2, Circle, BookOpen } from 'lucide-react';

export function LearningSetup() {
  const navigate = useNavigate();
  const { startExam, resetExam, examMode } = useExamStore();
  
  const [subjects, setSubjects] = useState<{subject_slug: string, total: number}[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [qCount, setQCount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (examMode !== 'learning') navigate('/login');
    resetExam();
    fetchSubjects().then(setSubjects).catch(console.error);
  }, [resetExam, examMode, navigate]);

  // When a subject is selected, fetch its topics
  const handleSelectSubject = async (slug: string) => {
    if (selectedSubject === slug) {
      // Deselect
      setSelectedSubject(null);
      setTopics([]);
      setSelectedTopics([]);
      return;
    }
    
    setSelectedSubject(slug);
    setSelectedTopics([]);
    setLoadingTopics(true);
    try {
      const t = await fetchTopics(slug);
      setTopics(t);
    } catch (err) {
      console.error(err);
    }
    setLoadingTopics(false);
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) setSelectedTopics(selectedTopics.filter(t => t !== topic));
    else setSelectedTopics([...selectedTopics, topic]);
  };

  const handleStart = async () => {
    if (!selectedSubject || !qCount) return;
    setLoading(true);
    try {
      const questions = await fetchTopicQuestions(selectedSubject, selectedTopics, Number(qCount));
      
      startExam(
        [selectedSubject], 
        { [selectedSubject]: questions }, 
        { mode: 'learning', timeLimit: null, showAnswers: 'instant' }
      );
      navigate('/runner');
    } catch (err) {
      alert("Failed to load questions. Check connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 pb-32">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Learning Mode</h1>
          <p className="text-slate-500 text-sm">Master specific topics with instant feedback</p>
        </div>
      </header>

      {/* STEP 1: SELECT SUBJECT */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">1. Select a Subject</h2>
        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {subjects.map(sub => {
            const isSelected = selectedSubject === sub.subject_slug;
            return (
              <button
                key={sub.subject_slug}
                onClick={() => handleSelectSubject(sub.subject_slug)}
                className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                  isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="font-bold text-slate-800 text-xs capitalize pr-5 truncate">
                  {sub.subject_slug.replace(/-/g, ' ')}
                </div>
                <div className="absolute top-3 right-3 text-purple-600">
                  {isSelected ? <CheckCircle2 size={18} className="fill-purple-100"/> : <Circle size={18} className="text-slate-300"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT TOPICS (Only shows if a subject is selected) */}
      {selectedSubject && (
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <BookOpen size={16} /> 2. Select Topics
            </h2>
            <button 
              onClick={() => setSelectedTopics(topics)} 
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              Select All
            </button>
          </div>
          
          {loadingTopics ? (
            <p className="text-sm text-slate-400 py-4 text-center">Loading topics...</p>
          ) : topics.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No topics found.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {topics.map(topic => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isSelected 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          )}
          
          {selectedTopics.length === 0 && topics.length > 0 && (
            <p className="text-xs text-orange-500 mt-3 font-medium">No topics selected. Questions will be pulled randomly from the whole subject.</p>
          )}
        </div>
      )}

      {/* STEP 3: NUMBER OF QUESTIONS */}
      {selectedSubject && (
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-slide-up">
          <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">3. Number of Questions</h2>
          <input 
            type="number" 
            placeholder="e.g. 20"
            value={qCount}
            onChange={e => setQCount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg"
          />
        </div>
      )}

      {/* START BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 block">TOTAL QUESTIONS</span>
            <span className="font-bold text-slate-800 text-lg">{Number(qCount) || 0}</span>
          </div>
          <button
            onClick={handleStart}
            disabled={!selectedSubject || !qCount || loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Start Learning'}
          </button>
        </div>
      </div>
    </div>
  );
}
