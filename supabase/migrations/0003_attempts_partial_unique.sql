-- =============================================================
-- Патч: разрешить студенту пройти тест повторно.
-- =============================================================
-- Контекст: исходный constraint unique(test_id, student_id) запрещал
-- создавать новую попытку, даже если предыдущая уже завершена
-- (finished_at IS NOT NULL). Из-за этого при повторном заходе
-- на тот же тест приложение падало с ошибкой
-- "duplicate key value violates unique constraint".
--
-- Семантика: у студента может быть только одна АКТИВНАЯ попытка
-- по тесту, но завершённых — сколько угодно. Заменяем full-unique
-- на partial unique index с условием "только незавершённые".

alter table public.attempts
  drop constraint if exists attempts_test_id_student_id_key;

drop index if exists attempts_active_unique_idx;
create unique index attempts_active_unique_idx
  on public.attempts (test_id, student_id)
  where finished_at is null;
