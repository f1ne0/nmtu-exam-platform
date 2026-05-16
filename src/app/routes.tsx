import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@shared/config/routes';
import { HomePage } from '@pages/home';
import { TeacherAuthPage } from '@pages/teacher-auth';
import { TeacherDashboardPage } from '@pages/teacher-dashboard';
import { TeacherTestEditorPage } from '@pages/teacher-test-editor';
import { TeacherTestPreviewPage } from '@pages/teacher-test-preview';
import { StudentNamePage } from '@pages/student-name';
import { StudentTestsPage } from '@pages/student-tests';
import { StudentTestRunnerPage } from '@pages/student-test-runner';
import { StudentResultPage } from '@pages/student-result';

export const AppRoutes = () => (
  <Routes>
    <Route path={ROUTES.HOME} element={<HomePage />} />
    <Route path={ROUTES.TEACHER_AUTH} element={<TeacherAuthPage />} />
    <Route path={ROUTES.TEACHER_DASHBOARD} element={<TeacherDashboardPage />} />
    <Route path={ROUTES.TEACHER_TEST_NEW} element={<TeacherTestEditorPage />} />
    <Route path={ROUTES.TEACHER_TEST_PREVIEW} element={<TeacherTestPreviewPage />} />
    <Route path={ROUTES.TEACHER_TEST_EDIT} element={<TeacherTestEditorPage />} />
    <Route path={ROUTES.STUDENT_NAME} element={<StudentNamePage />} />
    <Route path={ROUTES.STUDENT_TESTS} element={<StudentTestsPage />} />
    <Route path={ROUTES.STUDENT_TEST_RUNNER} element={<StudentTestRunnerPage />} />
    <Route path={ROUTES.STUDENT_RESULT} element={<StudentResultPage />} />
    <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
  </Routes>
);
