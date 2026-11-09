import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AITutor({ 
  question, 
  options, 
  correctAnswer, 
  explanation 
}: { 
  question: string; 
  options: Record<string, string>; 
  correctAnswer: string; 
  explanation?: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setIsOpen(true);
    setLoading(true);
    setResponse('');

    const prompt = `
      You are an expert JAMB tutor. Explain this question to a student simply and clearly.
      
      Question: ${question}
      Options: ${JSON.stringify(options)}
      Correct Answer: ${correctAnswer}
      ${explanation ? `Existing explanation: ${explanation}` : ''}
      
      Please provide a step-by-step breakdown. Keep it under 150 words and use simple language.
    `;

    try {
      const WORKER_URL = "https://ai-tutor-proxy.YOUR-SUBDOMAIN.workers.dev"; // Replace with your URL if changed

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");
      
      setResponse(data.text);
    } catch (err: any) {
      console.error(err);
      setResponse("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={askAI}
        className="mt-3 flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
      >
        <Sparkles size={14} /> Ask AI Tutor
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="bg-purple-600 p-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles size={16} /> AI Tutor
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-purple-700 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-10">
              <Loader2 className="animate-spin" size={20} /> Thinking...
            </div>
          ) : (
            /* Render Markdown beautifully */
            <div className="text-sm text-slate-700 leading-relaxed prose prose-sm prose-purple max-w-none">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
