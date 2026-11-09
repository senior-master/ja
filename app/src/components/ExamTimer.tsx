import { useEffect, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Clock } from 'lucide-react';

export function ExamTimer() {
  const endTime = useExamStore((state) => state.endTime);
  const submitExam = useExamStore((state) => state.submitExam);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        submitExam();
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, submitExam]);

  // If there is no endTime (like in Learning Mode), show "No Timer"
  if (!endTime) {
    return (
      <div className="flex items-center gap-2 font-mono text-lg font-bold text-zinc-600">
        <Clock size={20} />
        No Timer
      </div>
    );
  }

  const isDanger = endTime && (endTime - Date.now()) < 5 * 60 * 1000;

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isDanger ? 'text-red-500 animate-pulse' : 'text-white'}`}>
      <Clock size={20} className={isDanger ? 'text-red-500' : 'text-amber-500'} />
      {timeLeft}
    </div>
  );
}
