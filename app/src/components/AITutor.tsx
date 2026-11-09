import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { MathText } from './MathText';

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
      Do NOT wrap math in \\( \\) or \\[ \\]. Use $ for inline math and $$ for block math.
    `;

    try {
      // ⚠️ PASTE YOUR ACTUAL CLOUDFLARE WORKER URL HERE
      const WORKER_URL = "https://ai-tutor-proxy.abdul01abdul03.workers.dev/"; 

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const textData = await res.text();
      if (!res.ok) throw new Error(`Server ${res.status}: ${textData}`);

      const data = JSON.parse(textData);
      setResponse(data.text);
    } catch (err: any) {
      console.error(err);
      setResponse(`Error: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="block mt-3 mb-1 text-white">
            <MathText text={boldText} />
          </strong>
        );
      }
      return <MathText key={index} text={part} />;
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={askAI}
        className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
      >
        <Sparkles size={14} /> Ask AI Tutor
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles size={16} className="text-amber-500" /> AI Tutor
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-amber-500 py-10">
              <Loader2 className="animate-spin" size={20} /> Thinking...
            </div>
          ) : (
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {formatResponse(response)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
