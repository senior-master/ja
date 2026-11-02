import { useExamStore, type Question } from '../store/useExamStore';

export function QuestionCard({ question }: { question: Question }) {
  const answers = useExamStore((state) => state.answers);
  const setAnswer = useExamStore((state) => state.setAnswer);
  const selectedAnswer = answers[question.id];

  const options = ['A', 'B', 'C', 'D'] as const;
  const optionText = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <p className="text-lg text-slate-800 mb-6 font-medium leading-relaxed">{question.question}</p>
      <div className="flex flex-col gap-3">
        {options.map((letter) => (
          <button
            key={letter}
            onClick={() => setAnswer(question.id, letter)}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
              selectedAnswer === letter ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
              selectedAnswer === letter ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>{letter}</div>
            <span className="text-slate-700">{optionText[letter]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
