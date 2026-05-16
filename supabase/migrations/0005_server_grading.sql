-- =============================================================
-- Серверная проверка ответов + полный шафл (вопросы + варианты).
-- =============================================================
-- Цель: студент НЕ должен иметь доступа к correctIndex ни через
-- DevTools, ни через прямой запрос к таблице tests. Проверка
-- происходит на сервере через SECURITY DEFINER функции.
--
-- Структура attempts.shuffled_questions меняется. Каждый элемент:
--   { id, text, options, option_map }
-- где:
--   - options    — варианты в перемешанном порядке (без правильного флага)
--   - option_map — массив, который на индексе i содержит ИСХОДНЫЙ
--                  индекс варианта options[i]. Используется сервером
--                  при подсчёте, клиент его не использует.
-- correctIndex в attempts НЕ хранится.
-- =============================================================

-- ----------- 1. Запретить студентам прямой SELECT на tests -----------
drop policy if exists "tests_select_all_authed" on public.tests;
drop policy if exists "tests_select_teacher" on public.tests;
create policy "tests_select_teacher" on public.tests
  for select to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ----------- 2. Список тестов для студента (без questions!) -----------
create or replace function public.list_tests_for_student()
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
    t.id,
    t.title,
    t.description,
    t.duration_minutes,
    coalesce(jsonb_array_length(t.questions), 0)::int as questions_count,
    t.created_at
  from public.tests t
  order by t.created_at desc;
$$;

grant execute on function public.list_tests_for_student() to authenticated;

-- ----------- 3. Старт попытки (создаёт перемешанный snapshot) -----------
-- Возвращает JSONB:
--   {
--     attempt: { id, test_id, current_index, selections, started_at, shuffled_questions },
--     test:    { id, title, description, duration_minutes, questions_count }
--   }
-- shuffled_questions клиенту отдаётся БЕЗ option_map (он ему не нужен —
-- сервер сам сделает unmap при submit).

create or replace function public.start_attempt(p_test_id uuid)
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
  v_opts_count int;
  v_opt_indices int[];
  v_out_q jsonb;
  v_questions_count int;
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  -- Только студент должен попадать сюда.
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'students_only';
  end if;

  select id, title, description, duration_minutes, questions
  into v_test
  from public.tests
  where id = p_test_id;
  if not found then
    raise exception 'test_not_found';
  end if;

  -- Студент уже сдал этот тест — нельзя.
  if exists (
    select 1 from public.results
    where test_id = p_test_id and student_id = v_user_id
  ) then
    raise exception 'already_passed';
  end if;

  -- Есть незавершённая попытка — продолжаем её, не пересоздавая.
  select id, shuffled_questions, started_at, current_index, selections
  into v_existing
  from public.attempts
  where test_id = p_test_id and student_id = v_user_id and finished_at is null
  limit 1;

  v_questions_count := coalesce(jsonb_array_length(v_test.questions), 0);

  if found then
    v_attempt_id   := v_existing.id;
    v_shuffled     := v_existing.shuffled_questions;
    v_started_at   := v_existing.started_at;
    v_current_index := v_existing.current_index;
    v_selections   := v_existing.selections;
  else
    -- Перемешать индексы вопросов
    select array_agg(i order by random())
    into v_rand_q_indices
    from generate_series(0, v_questions_count - 1) as i;

    v_shuffled := '[]'::jsonb;

    if v_rand_q_indices is not null then
      foreach v_q_idx in array v_rand_q_indices loop
        v_q := v_test.questions -> v_q_idx;
        v_opts_count := coalesce(jsonb_array_length(v_q -> 'options'), 0);

        select array_agg(i order by random())
        into v_opt_indices
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
      from generate_series(1, v_questions_count) i
    );

    insert into public.attempts (
      id, test_id, student_id, student_name,
      shuffled_questions, selections, current_index, started_at, finished_at
    ) values (
      v_attempt_id,
      p_test_id,
      v_user_id,
      coalesce(
        (select student_name from public.attempts
         where student_id = v_user_id order by started_at desc limit 1),
        'Студент'
      ),
      v_shuffled,
      v_selections,
      0,
      v_started_at,
      null
    );
  end if;

  -- Стрипаем option_map перед возвратом клиенту.
  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt_id,
      'testId', p_test_id,
      'currentIndex', v_current_index,
      'selections', v_selections,
      'startedAt', v_started_at,
      'shuffledQuestions', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', q ->> 'id',
          'text', q ->> 'text',
          'options', q -> 'options'
        )), '[]'::jsonb)
        from jsonb_array_elements(v_shuffled) as q
      )
    ),
    'test', jsonb_build_object(
      'id', v_test.id,
      'title', v_test.title,
      'description', v_test.description,
      'durationMinutes', v_test.duration_minutes,
      'questionsCount', v_questions_count
    )
  );
end;
$$;

grant execute on function public.start_attempt(uuid) to authenticated;

-- ----------- 4. Старт попытки с именем (фронт передаёт имя один раз) -----------
-- Удобно: имя студента известно только клиенту. После start_attempt
-- сразу прокидываем имя в текущий attempt.

create or replace function public.set_attempt_student_name(p_test_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;
  if length(coalesce(p_name, '')) < 2 then
    return;
  end if;
  update public.attempts
    set student_name = p_name
    where test_id = p_test_id and student_id = v_user_id and finished_at is null;
end;
$$;

grant execute on function public.set_attempt_student_name(uuid, text) to authenticated;

-- ----------- 5. Завершение попытки (серверный подсчёт) -----------
-- Принимает selections (массив длиной n; null или int — индекс в shuffled-options).
-- Возвращает result_id.

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
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  select * into v_attempt
  from public.attempts
  where test_id = p_test_id and student_id = v_user_id and finished_at is null
  limit 1;
  if not found then
    raise exception 'no_active_attempt';
  end if;

  if exists (
    select 1 from public.results where test_id = p_test_id and student_id = v_user_id
  ) then
    raise exception 'already_passed';
  end if;

  select id, title, questions into v_test from public.tests where id = p_test_id;
  if not found then
    raise exception 'test_not_found';
  end if;

  v_total := coalesce(jsonb_array_length(v_attempt.shuffled_questions), 0);

  for v_i in 0 .. (v_total - 1) loop
    v_shuffled_q := v_attempt.shuffled_questions -> v_i;
    v_opt_map := v_shuffled_q -> 'option_map';

    select q into v_orig_q
    from jsonb_array_elements(v_test.questions) as q
    where q ->> 'id' = v_shuffled_q ->> 'id'
    limit 1;

    if v_orig_q is null then
      continue;
    end if;

    v_orig_correct := (v_orig_q ->> 'correctIndex')::int;
    v_options_len := coalesce(jsonb_array_length(v_shuffled_q -> 'options'), 0);

    -- Найти позицию правильного варианта в shuffled-порядке.
    v_new_correct := null;
    for v_pos in 0 .. (v_options_len - 1) loop
      v_idx := (v_opt_map ->> v_pos)::int;
      if v_idx = v_orig_correct then
        v_new_correct := v_pos;
        exit;
      end if;
    end loop;

    -- Что выбрал студент.
    if jsonb_typeof(p_selections -> v_i) = 'number' then
      v_selected := (p_selections ->> v_i)::int;
      if v_selected < 0 or v_selected >= v_options_len then
        v_selected := null;
        v_orig_selected := null;
      else
        v_orig_selected := (v_opt_map ->> v_selected)::int;
      end if;
    else
      v_selected := null;
      v_orig_selected := null;
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
    score, total, percentage, answers
  ) values (
    v_result_id, p_test_id, v_test.title, v_user_id, v_attempt.student_name,
    v_score, v_total, v_percentage, v_answers
  );

  update public.attempts
    set finished_at = now()
    where id = v_attempt.id;

  return jsonb_build_object('result_id', v_result_id);
end;
$$;

grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
