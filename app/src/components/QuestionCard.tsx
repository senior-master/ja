import { useExamStore, type Question } from '../store/useExamStore';
import { MathText } from './MathText';
import { AITutor } from './AITutor';
import { ReportQuestion } from './ReportQuestion';

export function QuestionCard({ question }: { question: Question }) {
  const { answers, setAnswer, examConfig } = useExamStore();
  const selectedAnswer = answers[question.id];
  const isInstant = examConfig?.showAnswers === 'instant';

  const options = ['A', 'B', 'C', 'D'] as const;
  const optionText = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800 transition-colors">
      <div className="text-lg text-white mb-6 font-medium leading-relaxed">
        <MathText text={question.question} />
      </div>
      
      <div className="flex flex-col gap-3">
        {options.map((letter) => {
          let btnClass = "border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/50";
          let letterClass = "bg-zinc-800 text-zinc-400";
          let textClass = "text-zinc-200";
          
          if (selectedAnswer === letter) {
            btnClass = "border-amber-500 bg-amber-500/10";
            letterClass = "bg-amber-500 text-black";
            textClass = "text-amber-500";
          }

          if (isInstant && selectedAnswer) {
            if (letter === question.correct_answer) {
              btnClass = "border-emerald-500 bg-emerald-500/10";
              letterClass = "bg-emerald-500 text-white";
              textClass = "text-emerald-400";
            } else if (selectedAnswer === letter) {
              btnClass = "border-red-500 bg-red-500/10";
              letterClass = "bg-red-500 text-white";
              textClass = "text-red-400";
            }
          }

          return (
            <button
              key={letter}
              onClick={() => !selectedAnswer && setAnswer(question.id, letter)}
              disabled={isInstant && !!selectedAnswer}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${btnClass}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold flex-shrink-0 ${letterClass}`}>
                {letter}
              </div>
              <div className={`flex-1 ${textClass}`}>
                <MathText text={optionText[letter]} />
              </div>
            </button>
          );
        })}
      </div>

      {isInstant && selectedAnswer && (
        <div className="mt-6 p-4 bg-zinc-950 border-l-4 border-amber-500 rounded-r-lg animate-slide-up">
          <div className="font-bold mb-1">
            {selectedAnswer === question.correct_answer ? (
              <span className="text-emerald-400">✅ Correct!</span>
            ) : (
              <span className="text-red-400">❌ Incorrect. The answer is {question.correct_answer}.</span>
            )}
          </div>
          <div className="text-sm text-zinc-400 leading-relaxed mb-4">
            <MathText text={question.explanation} />
          </div>
          <AITutor 
            question={question.question}
            options={{ A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d }}
            correctAnswer={question.correct_answer}
            explanation={question.explanation}
          />
        </div>
      )}
      
      <div className="mt-4 flex justify-end border-t border-zinc-800 pt-2">
        <ReportQuestion questionId={question.id} />
      </div>
    </div>
  );
}
