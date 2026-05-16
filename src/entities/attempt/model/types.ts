export interface AttemptQuestion {
  id: string;
  text: string;
  options: string[];
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
