import { useExamStore, type Question } from '../store/useExamStore';
import { MathText } from './MathText';
import { AITutor } from './AITutor';

export function QuestionCard({ question }: { question: Question }) {
  const { answers, setAnswer, examConfig } = useExamStore();
  const selectedAnswer = answers[question.id];
  const isInstant = examConfig?.showAnswers === 'instant';

  const options = ['A', 'B', 'C', 'D'] as const;
  const optionText = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
      <div className="text-lg text-slate-800 dark:text-slate-100 mb-6 font-medium leading-relaxed">
        <MathText text={question.question} />
      </div>
      
      <div className="flex flex-col gap-3">
        {options.map((letter) => {
          let btnClass = "border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50";
          let letterClass = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300";
          let textClass = "text-slate-700 dark:text-slate-200";
          
          if (selectedAnswer === letter) {
            btnClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600";
            letterClass = "bg-blue-500 text-white";
            textClass = "text-blue-900 dark:text-blue-100";
          }

          if (isInstant && selectedAnswer) {
            if (letter === question.correct_answer) {
              btnClass = "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600";
              letterClass = "bg-green-500 text-white";
              textClass = "text-green-900 dark:text-green-100";
            } else if (selectedAnswer === letter) {
              btnClass = "border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-600";
              letterClass = "bg-red-500 text-white";
              textClass = "text-red-900 dark:text-red-100";
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
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 border-l-4 border-blue-500 rounded-r-lg animate-slide-up">
          <div className="font-bold mb-1">
            {selectedAnswer === question.correct_answer ? (
              <span className="text-green-600 dark:text-green-400">✅ Correct!</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">❌ Incorrect. The answer is {question.correct_answer}.</span>
            )}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
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
    </div>
  );
}
