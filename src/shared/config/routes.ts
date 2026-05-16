export const ROUTES = {
  HOME: '/',
  TEACHER_AUTH: '/teacher/auth',
  TEACHER_DASHBOARD: '/teacher',
  TEACHER_TEST_NEW: '/teacher/tests/new',
  TEACHER_TEST_EDIT: '/teacher/tests/:id',
  TEACHER_TEST_PREVIEW: '/teacher/tests/:id/preview',
  STUDENT_NAME: '/student',
  STUDENT_TESTS: '/student/tests',
  STUDENT_TEST_RUNNER: '/student/tests/:id/run',
  STUDENT_RESULT: '/student/result/:id',
} as const;

export const teacherEditPath = (id: string) => `/teacher/tests/${id}`;
export const teacherPreviewPath = (id: string) => `/teacher/tests/${id}/preview`;
export const studentRunPath = (id: string) => `/student/tests/${id}/run`;
export const studentResultPath = (id: string) => `/student/result/${id}`;
