import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Question = {
  id: number;
  subject_slug: string;
  topic: string;
  subtopic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
};

type ExamState = {
  status: 'idle' | 'active' | 'submitted';
  user: any | null;
  profile: { streak: number; last_active: string } | null; // Supabase User object
  examMode: 'cbt' | 'practice' | 'learning' | null;
  examConfig: { mode: string; timeLimit: number | null; showAnswers: 'instant' | 'end' } | null;
  
  subjects: string[]; 
  questions: Record<string, Question[]>;
  answers: Record<number, string>;
  flags: number[];
  activeSubject: string;
  currentIndexes: Record<string, number>;
  endTime: number | null;
  isNavigatorOpen: boolean;
  isReviewOpen: boolean;
  isCalculatorOpen: boolean;
  isCatchingSkips: boolean;
  candidateInfo: { name: string; regNo: string };
  
  // Actions
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  setExamMode: (mode: 'cbt' | 'practice' | 'learning') => void;
  logout: () => void;
  
  startExam: (subjects: string[], questions: Record<string, Question[]>, config: { mode: string; timeLimit: number | null; showAnswers: 'instant' | 'end' }) => void;
  setAnswer: (questionId: number, answer: string) => void;
  toggleFlag: (questionId: number) => void;
  setActiveSubject: (subject: string) => void;
  setCurrentIndex: (subject: string, index: number) => void;
  submitExam: () => void;
  resetExam: () => void;
  toggleNavigator: () => void;
  toggleReview: () => void;
  toggleCalculator: () => void;
  setIsCatchingSkips: (val: boolean) => void;
};

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      status: 'idle',
      user: null,
      profile: null,
      examMode: null,
      examConfig: null,
      subjects: [],
      questions: {},
      answers: {},
      flags: [],
      activeSubject: '',
      currentIndexes: {},
      endTime: null,
      isNavigatorOpen: false,
      isReviewOpen: false,
      isCalculatorOpen: false,
      isCatchingSkips: false,
      candidateInfo: { name: 'Student', regNo: '2026UTME/001' },

      setUser: (user) => set({ user, candidateInfo: { name: user?.email?.split('@')[0] || 'Student', regNo: user?.id?.slice(0,8) || 'N/A' } }),
      setProfile: (profile) => set({ profile }),
      setExamMode: (mode) => set({ examMode: mode }),
      logout: () => set({ user: null, examMode: null, status: 'idle' }),

      startExam: (subjects, questions, config) => set({
        status: 'active',
        subjects,
        questions,
        answers: {},
        flags: [],
        activeSubject: subjects[0],
        currentIndexes: Object.fromEntries(subjects.map(s => [s, 0])),
        examConfig: config,
        endTime: config.timeLimit ? Date.now() + config.timeLimit : null,
        isReviewOpen: false,
        isNavigatorOpen: false,
        isCalculatorOpen: false,
        isCatchingSkips: false,
      }),

      setAnswer: (qid, ans) => set((s) => ({ answers: { ...s.answers, [qid]: ans } })),
      toggleFlag: (qid) => set((s) => ({ flags: s.flags.includes(qid) ? s.flags.filter(id => id !== qid) : [...s.flags, qid] })),
      setActiveSubject: (sub) => set({ activeSubject: sub }),
      setCurrentIndex: (sub, idx) => set((s) => ({ currentIndexes: { ...s.currentIndexes, [sub]: idx } })),
      submitExam: () => set({ status: 'submitted' }),
      
      resetExam: () => set({ 
        status: 'idle', 
        questions: {}, 
        answers: {}, 
        flags: [], 
        endTime: null,
        isReviewOpen: false,
        isNavigatorOpen: false,
        isCalculatorOpen: false,
        isCatchingSkips: false,
      }),

      toggleNavigator: () => set((s) => ({ isNavigatorOpen: !s.isNavigatorOpen })),
      toggleReview: () => set((s) => ({ isReviewOpen: !s.isReviewOpen })),
      toggleCalculator: () => set((s) => ({ isCalculatorOpen: !s.isCalculatorOpen })),
      setIsCatchingSkips: (val) => set({ isCatchingSkips: val }),
    }),
    { name: 'jamb-exam-storage' }
  )
);
