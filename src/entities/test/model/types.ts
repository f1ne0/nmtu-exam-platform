export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
  createdAt: number;
  archived: boolean;
  questionsPerAttempt: number | null;
  groupIds: string[];
}
