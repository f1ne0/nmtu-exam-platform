export interface TestRow {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions: unknown;
  created_by: string | null;
  created_at: string;
  archived: boolean;
  questions_per_attempt: number | null;
}

export interface ResultRow {
  id: string;
  test_id: string;
  test_title: string;
  student_id: string | null;
  student_name: string;
  score: number;
  total: number;
  percentage: number;
  answers: unknown;
  violations: unknown;
  completed_at: string;
  group_id: string | null;
}

export interface AttemptRow {
  id: string;
  test_id: string;
  student_id: string;
  student_name: string;
  shuffled_questions: unknown;
  selections: unknown;
  current_index: number;
  started_at: string;
  finished_at: string | null;
  group_id: string | null;
}

export interface GroupRow {
  id: string;
  name: string;
  code: string;
  created_at: string;
  created_by: string | null;
}

export interface TestGroupRow {
  test_id: string;
  group_id: string;
}
