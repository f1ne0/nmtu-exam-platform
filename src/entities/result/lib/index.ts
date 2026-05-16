import type { AnswerRecord } from '../model/types';

export interface ScoreSummary {
  score: number;
  total: number;
  percentage: number;
}

export const computeScore = (answers: readonly AnswerRecord[]): ScoreSummary => {
  const total = answers.length;
  let score = 0;
  for (const a of answers) {
    if (a.selectedIndex !== null && a.selectedIndex === a.correctIndex) score += 1;
  }
  const percentage = total === 0 ? 0 : Math.round((score / total) * 100);
  return { score, total, percentage };
};

export type GradeLevel = 'ok' | 'warn' | 'err';

export const gradeLevel = (percentage: number): GradeLevel => {
  if (percentage >= 75) return 'ok';
  if (percentage >= 50) return 'warn';
  return 'err';
};

export const gradeColor = (percentage: number): string => {
  const lvl = gradeLevel(percentage);
  if (lvl === 'ok') return 'ok';
  if (lvl === 'warn') return 'warn';
  return 'err';
};
