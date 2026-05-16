export type Role = 'teacher' | 'student';

export interface AsyncResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}
