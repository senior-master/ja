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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {/* Render Question with Math */}
      <div className="text-lg text-slate-800 mb-6 font-medium leading-relaxed">
        <MathText text={question.question} />
      </div>
      
      <div className="flex flex-col gap-3">
        {options.map((letter) => {
          let btnClass = "border-slate-100 hover:border-blue-200 hover:bg-slate-50";
          let letterClass = "bg-slate-100 text-slate-500";
          
          if (selectedAnswer === letter) {
            btnClass = "border-blue-500 bg-blue-50";
            letterClass = "bg-blue-500 text-white";
          }

          // Instant Feedback Logic
          if (isInstant && selectedAnswer) {
            if (letter === question.correct_answer) {
              btnClass = "border-green-500 bg-green-50";
              letterClass = "bg-green-500 text-white";
            } else if (selectedAnswer === letter) {
              btnClass = "border-red-500 bg-red-50";
              letterClass = "bg-red-500 text-white";
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
              {/* Render Option with Math */}
              <div className="text-slate-700 flex-1">
                <MathText text={optionText[letter]} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Instant Explanation Box */}
      {isInstant && selectedAnswer && (
        <div className="mt-6 p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg animate-slide-up">
          <div className="font-bold text-slate-800 mb-1">
            {selectedAnswer === question.correct_answer ? (
              <span className="text-green-600">✅ Correct!</span>
            ) : (
              <span className="text-red-600">❌ Incorrect. The answer is {question.correct_answer}.</span>
            )}
          </div>
          <div className="text-sm text-slate-600 leading-relaxed mb-4">
            <MathText text={question.explanation} />
          </div>
          
          {/* The AI Tutor Button */}
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
