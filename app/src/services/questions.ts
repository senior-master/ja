import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';
import type { Question } from '../store/useExamStore';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

export async function fetchSubjects() {
  const { data, error } = await supabase.from('question_stats').select('*').order('subject_slug');
  if (error) throw error;
  return data || [];
}

export async function fetchExamQuestions(subjects: string[]): Promise<Record<string, Question[]>> {
  const result: Record<string, Question[]> = {};
  
  for (const sub of subjects) {
    const count = sub === 'english-language' ? CONFIG.EXAM_RULES.ENGLISH_QUESTIONS : CONFIG.EXAM_RULES.OTHER_SUBJECT_QUESTIONS;
    const { data, error } = await supabase.rpc('get_random_questions', { p_subject: sub, p_count: count });
    if (error) throw error;
    result[sub] = data || [];
  }
  return result;
}
