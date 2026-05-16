import { generateId } from '@shared/lib/id';
import type { Question, Test } from '@entities/test';

export const createEmptyQuestion = (): Question => ({
  id: generateId(),
  text: '',
  options: ['', ''],
  correctIndex: 0,
});

export const createEmptyTest = (): Test => ({
  id: generateId(),
  title: '',
  description: '',
  durationMinutes: 30,
  questions: [createEmptyQuestion()],
  createdAt: Date.now(),
  archived: false,
  questionsPerAttempt: null,
  groupIds: [],
});
