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

// ── NEW FUNCTIONS FOR LEARNING MODE ──

export async function fetchTopics(subjectSlug: string): Promise<string[]> {
  // Fetch distinct topics by grabbing a large sample and extracting unique topics
  const { data, error } = await supabase
    .from('questions')
    .select('topic')
    .eq('subject_slug', subjectSlug)
    .limit(1000);
    
  if (error) throw error;
  if (!data) return [];
  
  const uniqueTopics = Array.from(new Set(data.map(q => q.topic)));
  return uniqueTopics.sort();
}

export async function fetchTopicQuestions(
  subjectSlug: string, 
  topics: string[], 
  count: number
): Promise<Question[]> {
  // If no topics selected, fetch random questions for the subject
  if (topics.length === 0) {
    const { data, error } = await supabase.rpc('get_random_questions', { p_subject: subjectSlug, p_count: count });
    if (error) throw error;
    return data || [];
  }

  // If topics selected, fetch questions matching those topics and shuffle them
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_slug', subjectSlug)
    .in('topic', topics)
    .limit(count);

  if (error) throw error;
  
  // Shuffle locally to keep it random
  return (data || []).sort(() => Math.random() - 0.5);
}

// ── NEW FUNCTION FOR DASHBOARD ──
export async function fetchUserHistory(userId: string) {
  const { data, error } = await supabase
    .from('user_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
