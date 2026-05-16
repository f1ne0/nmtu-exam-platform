export type { AnswerRecord, TestResult, ViolationEntry } from './model/types';
export { useResultStore } from './model/store';
export {
  getAllResults,
  getResultById,
  getMyResults,
  getMyResultForTest,
  saveResult,
  deleteResult,
} from './api';
export { computeScore, gradeColor, gradeLevel } from './lib';
export type { ScoreSummary, GradeLevel } from './lib';
