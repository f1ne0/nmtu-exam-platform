-- =============================================================
-- Билет: схема БД
-- Применить в Supabase Dashboard → SQL Editor одним запуском.
-- =============================================================

-- ----------- Расширения -----------
create extension if not exists "pgcrypto";

-- ----------- Таблица: tests -----------
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  questions jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tests_created_at_idx on public.tests (created_at desc);

-- ----------- Таблица: results -----------
create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  test_title text not null,
  student_id uuid references auth.users(id) on delete set null,
  student_name text not null,
  score int not null check (score >= 0),
  total int not null check (total >= 0),
  percentage int not null check (percentage between 0 and 100),
  answers jsonb not null,
  completed_at timestamptz not null default now()
);

create index if not exists results_completed_at_idx on public.results (completed_at desc);
create index if not exists results_test_id_idx on public.results (test_id);

-- Один тест = один результат на студента.
create unique index if not exists results_one_per_student_idx
  on public.results (test_id, student_id);

-- ----------- Таблица: attempts (snapshot прохождения) -----------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  shuffled_questions jsonb not null,
  selections jsonb not null default '[]'::jsonb,
  current_index int not null default 0 check (current_index >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists attempts_student_id_idx on public.attempts (student_id);

-- Только одна АКТИВНАЯ попытка на (test, student). Завершённых может быть сколько угодно.
create unique index if not exists attempts_active_unique_idx
  on public.attempts (test_id, student_id)
  where finished_at is null;

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.tests enable row level security;
alter table public.results enable row level security;
alter table public.attempts enable row level security;

-- ---- tests ----
-- Чтение: всем, кто авторизован (включая анонимных студентов).
drop policy if exists "tests_select_all_authed" on public.tests;
create policy "tests_select_all_authed" on public.tests
  for select to authenticated using (true);

-- Запись/обновление/удаление: только не-анонимные пользователи (преподаватели).
drop policy if exists "tests_insert_teacher" on public.tests;
create policy "tests_insert_teacher" on public.tests
  for insert to authenticated
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "tests_update_teacher" on public.tests;
create policy "tests_update_teacher" on public.tests
  for update to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "tests_delete_teacher" on public.tests;
create policy "tests_delete_teacher" on public.tests
  for delete to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ---- results ----
-- Чтение: преподаватели (не-анонимные) видят все результаты.
drop policy if exists "results_select_teacher" on public.results;
create policy "results_select_teacher" on public.results
  for select to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- Чтение: студент видит ТОЛЬКО свои результаты (нужно для экрана /student/result/:id).
-- Несколько SELECT-политик объединяются через OR — преподаватели по-прежнему видят всё.
drop policy if exists "results_select_owner" on public.results;
create policy "results_select_owner" on public.results
  for select to authenticated
  using (student_id = auth.uid());

-- Запись: студент может писать только свой результат (student_id = auth.uid()).
drop policy if exists "results_insert_owner" on public.results;
create policy "results_insert_owner" on public.results
  for insert to authenticated
  with check (student_id = auth.uid());

-- ---- attempts ----
-- Только владелец сессии видит и пишет свои попытки.
drop policy if exists "attempts_select_owner" on public.attempts;
create policy "attempts_select_owner" on public.attempts
  for select to authenticated using (student_id = auth.uid());

drop policy if exists "attempts_insert_owner" on public.attempts;
create policy "attempts_insert_owner" on public.attempts
  for insert to authenticated with check (student_id = auth.uid());

drop policy if exists "attempts_update_owner" on public.attempts;
create policy "attempts_update_owner" on public.attempts
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "attempts_delete_owner" on public.attempts;
create policy "attempts_delete_owner" on public.attempts
  for delete to authenticated using (student_id = auth.uid());
