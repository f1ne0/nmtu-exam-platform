import type { Question, Test } from '../model/types';

export interface TestValidationError {
  field: string;
  message: string;
}

export const getQuestionCount = (test: Test): number => test.questions.length;

export const validateTest = (test: Test): TestValidationError[] => {
  const errors: TestValidationError[] = [];
  if (!test.title.trim()) {
    errors.push({ field: 'title', message: 'Введите название теста' });
  }
  if (!Number.isFinite(test.durationMinutes) || test.durationMinutes <= 0) {
    errors.push({ field: 'durationMinutes', message: 'Длительность должна быть больше нуля' });
  }
  if (test.questions.length === 0) {
    errors.push({ field: 'questions', message: 'Добавьте хотя бы один вопрос' });
  }
  test.questions.forEach((q, qi) => {
    const errs = validateQuestion(q);
    for (const e of errs) {
      errors.push({ field: `questions.${qi}.${e.field}`, message: e.message });
    }
  });
  return errors;
};

export const validateQuestion = (q: Question): TestValidationError[] => {
  const errors: TestValidationError[] = [];
  if (!q.text.trim()) {
    errors.push({ field: 'text', message: 'Введите текст вопроса' });
  }
  const filled = q.options.filter((o) => o.trim().length > 0);
  if (filled.length < 2) {
    errors.push({ field: 'options', message: 'Нужно минимум два варианта' });
  }
  if (
    !Number.isInteger(q.correctIndex) ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.options.length ||
    !q.options[q.correctIndex] ||
    !q.options[q.correctIndex]?.trim()
  ) {
    errors.push({ field: 'correctIndex', message: 'Выберите правильный вариант' });
  }
  return errors;
};

export const isValidTest = (test: Test): boolean => validateTest(test).length === 0;
