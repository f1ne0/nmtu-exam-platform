import { getSupabase, type TestRow, type TestGroupRow } from '@shared/api/supabase';
import type { Question, Test } from '../model/types';

export interface StudentTestSummary {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questionsCount: number;
  createdAt: number;
}

interface StudentTestRow {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions_count: number;
  created_at: string;
}

const rowToTest = (r: TestRow, groupIds: string[]): Test => ({
  id: r.id,
  title: r.title,
  description: r.description,
  durationMinutes: r.duration_minutes,
  questions: (r.questions as Question[]) ?? [],
  createdAt: new Date(r.created_at).getTime(),
  archived: r.archived,
  questionsPerAttempt: r.questions_per_attempt,
  groupIds,
});

const fetchGroupAssignments = async (testIds: string[]): Promise<Map<string, string[]>> => {
  const out = new Map<string, string[]>();
  if (testIds.length === 0) return out;
  const { data, error } = await getSupabase()
    .from('test_groups')
    .select('*')
    .in('test_id', testIds);
  if (error) throw new Error(error.message);
  for (const row of (data as TestGroupRow[] | null) ?? []) {
    const arr = out.get(row.test_id) ?? [];
    arr.push(row.group_id);
    out.set(row.test_id, arr);
  }
  return out;
};

export const getAllTests = async (includeArchived = false): Promise<Test[]> => {
  const sb = getSupabase();
  let query = sb.from('tests').select('*').order('created_at', { ascending: false });
  if (!includeArchived) query = query.eq('archived', false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data as TestRow[] | null) ?? [];
  const groupMap = await fetchGroupAssignments(rows.map((r) => r.id));
  return rows.map((r) => rowToTest(r, groupMap.get(r.id) ?? []));
};

export const getTestById = async (id: string): Promise<Test | null> => {
  const { data, error } = await getSupabase()
    .from('tests')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as TestRow;
  const groupMap = await fetchGroupAssignments([row.id]);
  return rowToTest(row, groupMap.get(row.id) ?? []);
};

export const saveTest = async (test: Test): Promise<void> => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  const payload = {
    id: test.id,
    title: test.title,
    description: test.description,
    duration_minutes: test.durationMinutes,
    questions: test.questions,
    created_by: user?.id ?? null,
    created_at: new Date(test.createdAt).toISOString(),
    archived: test.archived,
    questions_per_attempt: test.questionsPerAttempt,
  };
  const { error: upsertError } = await sb.from('tests').upsert(payload, { onConflict: 'id' });
  if (upsertError) throw new Error(upsertError.message);

  const { error: delError } = await sb.from('test_groups').delete().eq('test_id', test.id);
  if (delError) throw new Error(delError.message);
  if (test.groupIds.length > 0) {
    const rows = test.groupIds.map((group_id) => ({ test_id: test.id, group_id }));
    const { error: insError } = await sb.from('test_groups').insert(rows);
    if (insError) throw new Error(insError.message);
  }
};

export const deleteTest = async (id: string): Promise<void> => {
  const { error } = await getSupabase().from('tests').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const setTestArchived = async (id: string, archived: boolean): Promise<void> => {
  const { error } = await getSupabase()
    .from('tests')
    .update({ archived })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const listTestsForStudent = async (
  groupId: string | null = null,
): Promise<StudentTestSummary[]> => {
  const { data, error } = await getSupabase().rpc('list_tests_for_student', {
    p_group_id: groupId,
  });
  if (error) throw new Error(error.message);
  return ((data as StudentTestRow[] | null) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    durationMinutes: r.duration_minutes,
    questionsCount: r.questions_count,
    createdAt: new Date(r.created_at).getTime(),
  }));
};
