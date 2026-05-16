import { getSupabase } from '@shared/api/supabase';
import type { Attempt } from '../model/types';

export interface SafeQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface AttemptStartTestMeta {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questionsCount: number;
}

export interface StartAttemptResult {
  attempt: Attempt;
  test: AttemptStartTestMeta;
}

interface RawStartAttempt {
  attempt: {
    id: string;
    testId: string;
    currentIndex: number;
    selections: Array<number | null>;
    startedAt: string;
    shuffledQuestions: SafeQuestion[];
  };
  test: {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    questionsCount: number;
  };
}

const requireUser = async () => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Сначала нужно войти');
  return { sb, userId: user.id };
};

export const startAttempt = async (
  testId: string,
  studentName: string,
  groupId: string | null = null,
): Promise<StartAttemptResult> => {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('start_attempt', {
    p_test_id: testId,
    p_group_id: groupId,
  });
  if (error) {
    const m = error.message || '';
    if (m.includes('already_passed')) throw new Error('already_passed');
    if (m.includes('test_not_found')) throw new Error('test_not_found');
    if (m.includes('test_archived')) throw new Error('test_archived');
    if (m.includes('group_required')) throw new Error('group_required');
    if (m.includes('group_not_allowed')) throw new Error('group_not_allowed');
    throw new Error(m);
  }
  const raw = data as RawStartAttempt;
  // Прокинуть имя в attempt (для отображения в кабинете преподавателя).
  await sb.rpc('set_attempt_student_name', { p_test_id: testId, p_name: studentName });

  const attempt: Attempt = {
    id: raw.attempt.id,
    testId: raw.attempt.testId,
    studentId: '',
    studentName,
    shuffledQuestions: raw.attempt.shuffledQuestions as unknown as Attempt['shuffledQuestions'],
    selections: raw.attempt.selections,
    currentIndex: raw.attempt.currentIndex,
    startedAt: new Date(raw.attempt.startedAt).getTime(),
    finishedAt: null,
  };
  return { attempt, test: raw.test };
};

export interface UpdateAttemptPatch {
  selections?: Array<number | null>;
  currentIndex?: number;
}

export const updateAttempt = async (id: string, patch: UpdateAttemptPatch): Promise<void> => {
  const { sb } = await requireUser();
  const update: Record<string, unknown> = {};
  if (patch.selections !== undefined) update.selections = patch.selections;
  if (patch.currentIndex !== undefined) update.current_index = patch.currentIndex;
  if (Object.keys(update).length === 0) return;
  const { error } = await sb.from('attempts').update(update).eq('id', id);
  if (error) throw new Error(error.message);
};

export interface SubmitAttemptResult {
  resultId: string;
}

export const recordViolation = async (testId: string, kind: string): Promise<void> => {
  const sb = getSupabase();
  // Намеренно не throw — нарушение лога не должно ломать тест.
  const { error } = await sb.rpc('record_violation', { p_test_id: testId, p_kind: kind });
  if (error) console.warn('[attempt] record_violation failed', error.message);
};

export const submitAttempt = async (
  testId: string,
  selections: Array<number | null>,
): Promise<SubmitAttemptResult> => {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('submit_attempt', {
    p_test_id: testId,
    p_selections: selections,
  });
  if (error) {
    if (error.message.includes('already_passed')) throw new Error('already_passed');
    if (error.message.includes('no_active_attempt')) throw new Error('no_active_attempt');
    throw new Error(error.message);
  }
  const raw = data as { result_id: string };
  return { resultId: raw.result_id };
};
