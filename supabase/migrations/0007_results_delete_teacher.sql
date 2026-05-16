-- =============================================================
-- Преподаватель может удалять результаты студентов.
-- =============================================================
-- При удалении результата с (test_id, student_id) этот же студент
-- сможет пройти тест повторно (start_attempt больше не увидит его
-- в results и пустит). Это и есть смысл удаления.

drop policy if exists "results_delete_teacher" on public.results;
create policy "results_delete_teacher" on public.results
  for delete to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
