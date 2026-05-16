-- =============================================================
-- Архивирование тестов + случайная выборка N вопросов + группы.
-- =============================================================

-- ----- 1. Архивирование -----
alter table public.tests
  add column if not exists archived boolean not null default false;

create index if not exists tests_active_idx
  on public.tests (created_at desc)
  where archived = false;

-- ----- 2. Сколько вопросов выдавать студенту (NULL = все) -----
alter table public.tests
  add column if not exists questions_per_attempt int
    check (questions_per_attempt is null or questions_per_attempt > 0);

-- ----- 3. Группы (классы) -----
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists groups_code_idx on public.groups (code);

create table if not exists public.test_groups (
  test_id uuid not null references public.tests(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  primary key (test_id, group_id)
);

create index if not exists test_groups_group_id_idx on public.test_groups (group_id);

-- Связь студент ↔ группа: один студент может быть только в одной группе.
-- Хранится в attempts.group_id и в его JWT-claim (через RPC join_group).
alter table public.attempts
  add column if not exists group_id uuid references public.groups(id) on delete set null;

alter table public.results
  add column if not exists group_id uuid references public.groups(id) on delete set null;

-- ----- 4. RLS для groups -----
alter table public.groups enable row level security;
alter table public.test_groups enable row level security;

-- groups: чтение — все авторизованные (студент может проверить код); запись — преподаватель.
drop policy if exists "groups_select_all" on public.groups;
create policy "groups_select_all" on public.groups
  for select to authenticated using (true);

drop policy if exists "groups_write_teacher" on public.groups;
create policy "groups_write_teacher" on public.groups
  for all to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- test_groups: чтение всем; запись только преподаватель.
drop policy if exists "test_groups_select_all" on public.test_groups;
create policy "test_groups_select_all" on public.test_groups
  for select to authenticated using (true);

drop policy if exists "test_groups_write_teacher" on public.test_groups;
create policy "test_groups_write_teacher" on public.test_groups
  for all to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ----- 5. RPC: проверить код группы -----
create or replace function public.find_group_by_code(p_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name
  from public.groups g
  where g.code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.find_group_by_code(text) to authenticated;

-- ----- 6. Обновить list_tests_for_student: фильтр по архиву и группе -----
-- p_group_id NULL = студент без группы, видит только тесты "для всех" (без assignment).
-- p_group_id != NULL = студент в группе, видит свои + тесты для всех.

create or replace function public.list_tests_for_student(p_group_id uuid default null)
returns table (
  id uuid,
  title text,
  description text,
  duration_minutes int,
  questions_count int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.id, t.title, t.description, t.duration_minutes,
    least(
      coalesce(t.questions_per_attempt, jsonb_array_length(t.questions)),
      coalesce(jsonb_array_length(t.questions), 0)
    )::int as questions_count,
    t.created_at
  from public.tests t
  where t.archived = false
    and (
      not exists (select 1 from public.test_groups tg where tg.test_id = t.id)
      or (
        p_group_id is not null
        and exists (
          select 1 from public.test_groups tg
          where tg.test_id = t.id and tg.group_id = p_group_id
        )
      )
    )
  order by t.created_at desc;
$$;

grant execute on function public.list_tests_for_student(uuid) to authenticated;

-- ----- 7. Обновить start_attempt: учёт archived, questions_per_attempt и group_id -----
create or replace function public.start_attempt(p_test_id uuid, p_group_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_test record;
  v_existing record;
  v_attempt_id uuid;
  v_started_at timestamptz;
  v_current_index int;
  v_selections jsonb;
  v_shuffled jsonb;
  v_q jsonb;
  v_q_idx int;
  v_rand_q_indices int[];
  v_picked_indices int[];
  v_opts_count int;
  v_opt_indices int[];
  v_out_q jsonb;
  v_total_pool int;
  v_questions_to_show int;
begin
  if v_user_id is null then raise exception 'auth_required'; end if;
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'students_only';
  end if;

  select id, title, description, duration_minutes, questions, archived, questions_per_attempt
  into v_test
  from public.tests
  where id = p_test_id;
  if not found then raise exception 'test_not_found'; end if;

  if v_test.archived then raise exception 'test_archived'; end if;

  if exists (select 1 from public.results where test_id = p_test_id and student_id = v_user_id) then
    raise exception 'already_passed';
  end if;

  -- Проверить, что тест доступен для группы студента (если у него есть).
  if exists (select 1 from public.test_groups where test_id = p_test_id) then
    if p_group_id is null then
      raise exception 'group_required';
    end if;
    if not exists (
      select 1 from public.test_groups tg
      where tg.test_id = p_test_id and tg.group_id = p_group_id
    ) then
      raise exception 'group_not_allowed';
    end if;
  end if;

  select id, shuffled_questions, started_at, current_index, selections
  into v_existing
  from public.attempts
  where test_id = p_test_id and student_id = v_user_id and finished_at is null
  limit 1;

  v_total_pool := coalesce(jsonb_array_length(v_test.questions), 0);
  v_questions_to_show := least(
    coalesce(v_test.questions_per_attempt, v_total_pool),
    v_total_pool
  );

  if found then
    v_attempt_id    := v_existing.id;
    v_shuffled      := v_existing.shuffled_questions;
    v_started_at    := v_existing.started_at;
    v_current_index := v_existing.current_index;
    v_selections    := v_existing.selections;
  else
    -- Перемешать индексы и взять только первые v_questions_to_show.
    select array_agg(i order by random())
    into v_rand_q_indices
    from generate_series(0, v_total_pool - 1) as i;

    v_picked_indices := v_rand_q_indices[1:v_questions_to_show];
    v_shuffled := '[]'::jsonb;

    if v_picked_indices is not null then
      foreach v_q_idx in array v_picked_indices loop
        v_q := v_test.questions -> v_q_idx;
        v_opts_count := coalesce(jsonb_array_length(v_q -> 'options'), 0);

        select array_agg(i order by random()) into v_opt_indices
        from generate_series(0, v_opts_count - 1) as i;

        v_out_q := jsonb_build_object(
          'id', v_q ->> 'id',
          'text', v_q ->> 'text',
          'options', (
            select coalesce(jsonb_agg(v_q -> 'options' -> orig_idx order by ord), '[]'::jsonb)
            from unnest(v_opt_indices) with ordinality as t(orig_idx, ord)
          ),
          'option_map', to_jsonb(v_opt_indices)
        );
        v_shuffled := v_shuffled || jsonb_build_array(v_out_q);
      end loop;
    end if;

    v_attempt_id    := gen_random_uuid();
    v_started_at    := now();
    v_current_index := 0;
    v_selections    := (
      select coalesce(jsonb_agg(null::jsonb), '[]'::jsonb)
      from generate_series(1, v_questions_to_show) i
    );

    insert into public.attempts (
      id, test_id, student_id, student_name,
      shuffled_questions, selections, current_index, started_at, finished_at, group_id
    ) values (
      v_attempt_id, p_test_id, v_user_id,
      coalesce(
        (select student_name from public.attempts
         where student_id = v_user_id order by started_at desc limit 1),
        'Студент'
      ),
      v_shuffled, v_selections, 0, v_started_at, null, p_group_id
    );
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt_id,
      'testId', p_test_id,
      'currentIndex', v_current_index,
      'selections', v_selections,
      'startedAt', v_started_at,
      'shuffledQuestions', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', q ->> 'id', 'text', q ->> 'text', 'options', q -> 'options'
        )), '[]'::jsonb)
        from jsonb_array_elements(v_shuffled) as q
      )
    ),
    'test', jsonb_build_object(
      'id', v_test.id,
      'title', v_test.title,
      'description', v_test.description,
      'durationMinutes', v_test.duration_minutes,
      'questionsCount', v_questions_to_show
    )
  );
end;
$$;

grant execute on function public.start_attempt(uuid, uuid) to authenticated;

-- ----- 8. Обновить submit_attempt: записать group_id из attempt в result -----
create or replace function public.submit_attempt(p_test_id uuid, p_selections jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt record;
  v_test record;
  v_total int;
  v_score int := 0;
  v_percentage int;
  v_result_id uuid;
  v_answers jsonb := '[]'::jsonb;
  v_i int;
  v_shuffled_q jsonb;
  v_orig_q jsonb;
  v_opt_map jsonb;
  v_orig_correct int;
  v_selected int;
  v_orig_selected int;
  v_new_correct int;
  v_options_len int;
  v_idx int;
  v_pos int;
begin
  if v_user_id is null then raise exception 'auth_required'; end if;

  select * into v_attempt
  from public.attempts
  where test_id = p_test_id and student_id = v_user_id and finished_at is null
  limit 1;
  if not found then raise exception 'no_active_attempt'; end if;

  if exists (select 1 from public.results where test_id = p_test_id and student_id = v_user_id) then
    raise exception 'already_passed';
  end if;

  select id, title, questions into v_test from public.tests where id = p_test_id;
  if not found then raise exception 'test_not_found'; end if;

  v_total := coalesce(jsonb_array_length(v_attempt.shuffled_questions), 0);

  for v_i in 0 .. (v_total - 1) loop
    v_shuffled_q := v_attempt.shuffled_questions -> v_i;
    v_opt_map := v_shuffled_q -> 'option_map';

    select q into v_orig_q
    from jsonb_array_elements(v_test.questions) as q
    where q ->> 'id' = v_shuffled_q ->> 'id'
    limit 1;
    if v_orig_q is null then continue; end if;

    v_orig_correct := (v_orig_q ->> 'correctIndex')::int;
    v_options_len := coalesce(jsonb_array_length(v_shuffled_q -> 'options'), 0);

    v_new_correct := null;
    for v_pos in 0 .. (v_options_len - 1) loop
      v_idx := (v_opt_map ->> v_pos)::int;
      if v_idx = v_orig_correct then v_new_correct := v_pos; exit; end if;
    end loop;

    if jsonb_typeof(p_selections -> v_i) = 'number' then
      v_selected := (p_selections ->> v_i)::int;
      if v_selected < 0 or v_selected >= v_options_len then
        v_selected := null; v_orig_selected := null;
      else
        v_orig_selected := (v_opt_map ->> v_selected)::int;
      end if;
    else
      v_selected := null; v_orig_selected := null;
    end if;

    if v_orig_selected is not null and v_orig_selected = v_orig_correct then
      v_score := v_score + 1;
    end if;

    v_answers := v_answers || jsonb_build_array(jsonb_build_object(
      'questionId', v_shuffled_q ->> 'id',
      'questionText', v_shuffled_q ->> 'text',
      'options', v_shuffled_q -> 'options',
      'selectedIndex', v_selected,
      'correctIndex', v_new_correct
    ));
  end loop;

  if v_total > 0 then
    v_percentage := round(100.0 * v_score / v_total)::int;
  else
    v_percentage := 0;
  end if;

  v_result_id := gen_random_uuid();
  insert into public.results (
    id, test_id, test_title, student_id, student_name,
    score, total, percentage, answers, violations, group_id
  ) values (
    v_result_id, p_test_id, v_test.title, v_user_id, v_attempt.student_name,
    v_score, v_total, v_percentage, v_answers,
    coalesce(v_attempt.violations, '[]'::jsonb),
    v_attempt.group_id
  );

  update public.attempts set finished_at = now() where id = v_attempt.id;
  return jsonb_build_object('result_id', v_result_id);
end;
$$;
