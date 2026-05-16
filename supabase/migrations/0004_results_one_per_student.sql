-- =============================================================
-- Один тест = один результат на студента.
-- =============================================================
-- Контекст: согласно правилам платформы студент должен пройти
-- каждый тест только один раз. Гарантируем это на уровне БД,
-- чтобы никакие гонки или обход UI не создали второй результат.
--
-- Существующие дубликаты (если есть) этот скрипт НЕ удаляет —
-- если индекс упадёт с ошибкой "could not create unique index",
-- сначала вычистите дубли вручную, оставив самый ранний:
--   delete from public.results r
--   using public.results r2
--   where r.test_id = r2.test_id and r.student_id = r2.student_id
--     and r.completed_at > r2.completed_at;

create unique index if not exists results_one_per_student_idx
  on public.results (test_id, student_id);
