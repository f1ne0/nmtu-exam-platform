-- =============================================================
-- Патч: разрешить студенту читать СВОЙ результат.
-- =============================================================
-- Контекст: после signInAnonymously() студент получает роль
-- `authenticated` (см. https://supabase.com/docs/guides/auth/auth-anonymous).
-- Политика results_select_teacher блокирует анонимных пользователей,
-- поэтому студент после завершения теста не может прочитать
-- /student/result/:id. Этот патч добавляет вторую SELECT-политику:
-- студент может прочитать только свою собственную запись (student_id = auth.uid()).
-- Преподаватель по-прежнему видит всё через results_select_teacher.

drop policy if exists "results_select_owner" on public.results;
create policy "results_select_owner" on public.results
  for select to authenticated
  using (student_id = auth.uid());
