import { generateId } from '@shared/lib/id';
import type { Question } from '@entities/test';

export interface ParsedTest {
  questions: Question[];
  warnings: string[];
}

const isQuestionEnd = (line: string) => /^\++\s*$/.test(line);
const isBlockSep = (line: string) => /^=+\s*$/.test(line);

export const parseTestText = (raw: string): ParsedTest => {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const warnings: string[] = [];
  const questions: Question[] = [];

  let buffer = '';
  let questionText = '';
  let questionTextDone = false;
  let options: string[] = [];
  let correctIndex = -1;

  const reset = () => {
    buffer = '';
    questionText = '';
    questionTextDone = false;
    options = [];
    correctIndex = -1;
  };

  const flushBlock = () => {
    const value = buffer.trim();
    buffer = '';
    if (!questionTextDone) {
      questionText = value;
      questionTextDone = true;
      return;
    }
    if (value === '') return;
    let opt = value;
    if (opt.startsWith('#')) {
      if (correctIndex === -1) correctIndex = options.length;
      opt = opt.slice(1).trimStart();
    }
    options.push(opt);
  };

  const flushQuestion = () => {
    flushBlock();
    if (!questionText && options.length === 0) {
      reset();
      return;
    }
    const idx = questions.length + 1;
    if (!questionText) warnings.push(`Вопрос ${idx}: пустой текст`);
    if (options.length < 2) warnings.push(`Вопрос ${idx}: меньше двух вариантов`);
    if (correctIndex === -1) {
      warnings.push(`Вопрос ${idx}: не отмечен правильный ответ (#)`);
    }
    questions.push({
      id: generateId(),
      text: questionText,
      options: [...options],
      correctIndex: correctIndex === -1 ? 0 : correctIndex,
    });
    reset();
  };

  for (const line of lines) {
    if (isQuestionEnd(line)) {
      flushQuestion();
      continue;
    }
    if (isBlockSep(line)) {
      flushBlock();
      continue;
    }
    buffer += (buffer ? '\n' : '') + line;
  }

  if (buffer.trim() || questionTextDone) {
    flushQuestion();
  }

  return { questions, warnings };
};
