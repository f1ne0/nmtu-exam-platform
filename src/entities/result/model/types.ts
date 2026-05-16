export interface AnswerRecord {
  questionId: string;
  questionText: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
}

export interface ViolationEntry {
  kind: string;
  at: string;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: number;
  answers: AnswerRecord[];
  violations: ViolationEntry[];
  groupId: string | null;
}
