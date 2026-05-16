import { getSupabase, type ResultRow } from '@shared/api/supabase';
import type { AnswerRecord, TestResult, ViolationEntry } from '../model/types';

const rowToResult = (r: ResultRow): TestResult => ({
  id: r.id,
  testId: r.test_id,
  testTitle: r.test_title,
  studentName: r.student_name,
  score: r.score,
  total: r.total,
  percentage: r.percentage,
  completedAt: new Date(r.completed_at).getTime(),
  answers: (r.answers as AnswerRecord[]) ?? [],
  violations: (r.violations as ViolationEntry[]) ?? [],
  groupId: r.group_id,
});

export const getAllResults = async (): Promise<TestResult[]> => {
  const { data, error } = await getSupabase()
    .from('results')
    .select('*')
    .order('completed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as ResultRow[] | null) ?? []).map(rowToResult);
};

export const getResultById = async (id: string): Promise<TestResult | null> => {
  const { data, error } = await getSupabase()
    .from('results')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToResult(data as ResultRow) : null;
};

export const getMyResults = async (): Promise<TestResult[]> => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('results')
    .select('*')
    .eq('student_id', user.id)
    .order('completed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as ResultRow[] | null) ?? []).map(rowToResult);
};

export const getMyResultForTest = async (testId: string): Promise<TestResult | null> => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from('results')
    .select('*')
    .eq('test_id', testId)
    .eq('student_id', user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToResult(data as ResultRow) : null;
};

export const deleteResult = async (id: string): Promise<void> => {
  const { error } = await getSupabase().from('results').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const saveResult = async (result: TestResult): Promise<void> => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Сначала нужно войти');
  const payload = {
    id: result.id,
    test_id: result.testId,
    test_title: result.testTitle,
    student_id: user.id,
    student_name: result.studentName,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    answers: result.answers,
    completed_at: new Date(result.completedAt).toISOString(),
  };
  const { error } = await sb.from('results').insert(payload);
  if (error) {
    if (error.code === '23505') {
      throw new Error('Этот тест уже пройден — результат сохранён ранее.');
    }
    throw new Error(error.message);
  }
};
