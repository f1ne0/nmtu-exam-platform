-- Полностью убрать систему нарушений (violations).
-- Дропаем RPC, колонки в attempts/results и пересоздаём submit_attempt
-- без ссылок на violations. Логика грейдинга идентична 0008.

drop function if exists public.record_violation(uuid, text);

alter table public.attempts drop column if exists violations;
alter table public.results  drop column if exists violations;

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
    score, total, percentage, answers, group_id
  ) values (
    v_result_id, p_test_id, v_test.title, v_user_id, v_attempt.student_name,
    v_score, v_total, v_percentage, v_answers, v_attempt.group_id
  );

  update public.attempts set finished_at = now() where id = v_attempt.id;
  return jsonb_build_object('result_id', v_result_id);
end;
$$;

grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
