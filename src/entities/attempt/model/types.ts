export interface AttemptQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number; // ДОБАВЛЕНО: для проверки ответов на клиенте
}

export interface Attempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  shuffledQuestions: AttemptQuestion[];
  selections: Array<number | null>;
  currentIndex: number;
  startedAt: number;
  finishedAt: number | null;
}