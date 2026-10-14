-- Question sets: tells real DECA exam attempts apart from attempts on PrepPlay's
-- original practice questions, so the dashboard can show All / DECA exams /
-- Practice questions, and /practice-questions can show progress per set.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-10-08-test-results.sql. It is safe to run again: every statement is
-- idempotent. Existing results are all real exams, so they keep 'deca'.

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------

alter table public.test_attempts
  add column if not exists question_set text not null default 'deca';

alter table public.test_attempts drop constraint if exists test_attempts_question_set_check;
alter table public.test_attempts
  add constraint test_attempts_question_set_check check (question_set in ('deca', 'original'));

create index if not exists test_attempts_user_set_submitted_idx
  on public.test_attempts (user_id, question_set, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Save: same signature, now records the set (sent by the server, which works
-- it out from the test files).
-- ---------------------------------------------------------------------------

create or replace function public.save_test_attempt(p_attempt jsonb, p_answers jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid := (p_attempt ->> 'id')::uuid;
  v_submitted timestamptz := (p_attempt ->> 'submitted_at')::timestamptz;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into test_attempts (
    id, user_id, mode, test_id, test_title, cluster, filters, started_at, submitted_at,
    total_questions, answered_count, correct_count, time_taken_seconds, timed_out, question_set
  )
  values (
    v_id,
    v_user,
    p_attempt ->> 'mode',
    p_attempt ->> 'test_id',
    p_attempt ->> 'test_title',
    p_attempt ->> 'cluster',
    p_attempt -> 'filters',
    (p_attempt ->> 'started_at')::timestamptz,
    v_submitted,
    (p_attempt ->> 'total_questions')::integer,
    (p_attempt ->> 'answered_count')::integer,
    (p_attempt ->> 'correct_count')::integer,
    (p_attempt ->> 'time_taken_seconds')::integer,
    coalesce((p_attempt ->> 'timed_out')::boolean, false),
    coalesce(p_attempt ->> 'question_set', 'deca')
  )
  on conflict (id) do nothing;

  if not found then
    return false;
  end if;

  insert into test_attempt_answers (
    attempt_id, position, user_id, submitted_at, source_test_id, source_number,
    pi_code, instructional_area, user_answer, is_correct, unanswered
  )
  select
    v_id, a.position, v_user, v_submitted, a.source_test_id, a.source_number,
    a.pi_code, a.instructional_area, a.user_answer, a.is_correct, a.unanswered
  from jsonb_to_recordset(p_answers) as a(
    position integer,
    source_test_id text,
    source_number integer,
    pi_code text,
    instructional_area text,
    user_answer text,
    is_correct boolean,
    unanswered boolean
  );

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reads: every dashboard function gains p_set ('deca', 'original', or null for
-- both). The old versions are dropped first so each name has one signature.
-- ---------------------------------------------------------------------------

drop function if exists public.test_dashboard_overview(timestamptz, timestamptz, text[]);
drop function if exists public.test_dashboard_compare(timestamptz, timestamptz);
drop function if exists public.test_missed_page(timestamptz, timestamptz, text, text, text, integer, integer);
drop function if exists public.test_missed_refs(timestamptz, timestamptz, text, text, text);
drop function if exists public.test_missed_matches(timestamptz, timestamptz, text, text, text);
drop function if exists public.test_history_page(timestamptz, timestamptz, text, text, text, integer, integer);

-- The caller's attempt ids in one set (all of them when p_set is null).
create or replace function public.test_attempt_ids_in_set(p_set text)
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select id from test_attempts
  where user_id = auth.uid() and (p_set is null or question_set = p_set);
$$;

create or replace function public.test_dashboard_overview(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_tags text[] default '{}',
  p_set text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with answers as (
    select instructional_area, pi_code, is_correct, note
    from test_attempt_answers
    where user_id = auth.uid()
      and (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
      and (p_set is null or attempt_id in (select test_attempt_ids_in_set(p_set)))
  ),
  attempts as (
    select mode, score_pct
    from test_attempts
    where user_id = auth.uid()
      and (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
      and (p_set is null or question_set = p_set)
  )
  select jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'answered', (select count(*) from answers),
        'correct', (select count(*) from answers where is_correct),
        'full_tests', (select count(*) from attempts where mode = 'full'),
        'custom_sessions', (select count(*) from attempts where mode = 'custom'),
        'best_full_pct', (select max(score_pct) from attempts where mode = 'full')
      )
    ),
    'areas', coalesce((
      select jsonb_agg(jsonb_build_object('area', area, 'answered', answered, 'correct', correct))
      from (
        select instructional_area as area, count(*) as answered, count(*) filter (where is_correct) as correct
        from answers
        group by instructional_area
      ) as by_area
    ), '[]'::jsonb),
    'pis', coalesce((
      select jsonb_agg(jsonb_build_object('area', area, 'pi', pi, 'answered', answered, 'correct', correct))
      from (
        select instructional_area as area, pi_code as pi, count(*) as answered,
               count(*) filter (where is_correct) as correct
        from answers
        group by instructional_area, pi_code
      ) as by_pi
    ), '[]'::jsonb),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('tag', tag, 'count', (
        select count(*) from answers
        where not is_correct and note is not null and left(note, length(tag)) = tag
      )) order by ord)
      from unnest(p_tags) with ordinality as t(tag, ord)
    ), '[]'::jsonb)
  );
$$;

create or replace function public.test_dashboard_compare(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_set text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with numbered as (
    select id, test_id, test_title, cluster, submitted_at, total_questions, correct_count, question_set,
           row_number() over (partition by test_id order by submitted_at, id) as attempt_number
    from test_attempts
    where user_id = auth.uid() and mode = 'full'
      and (p_set is null or question_set = p_set)
  ),
  in_range as (
    select *
    from numbered
    where (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
  ),
  latest as (
    select distinct on (test_id) *
    from in_range
    order by test_id, submitted_at desc, id desc
  )
  select jsonb_build_object(
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'test_id', test_id, 'test_title', test_title, 'cluster', cluster,
        'submitted_at', submitted_at, 'total', total_questions, 'correct', correct_count,
        'attempt_number', attempt_number, 'question_set', question_set
      ) order by submitted_at desc)
      from latest
    ), '[]'::jsonb),
    'cells', coalesce((
      select jsonb_agg(jsonb_build_object('attempt_id', attempt_id, 'area', area, 'total', total, 'correct', correct))
      from (
        select a.attempt_id, a.instructional_area as area, count(*) as total,
               count(*) filter (where a.is_correct) as correct
        from test_attempt_answers a
        join latest l on l.id = a.attempt_id
        where a.user_id = auth.uid()
        group by a.attempt_id, a.instructional_area
      ) as cells
    ), '[]'::jsonb),
    'trend', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'test_id', test_id, 'test_title', test_title, 'submitted_at', submitted_at,
        'total', total_questions, 'correct', correct_count
      ) order by submitted_at)
      from (select * from in_range order by submitted_at desc limit 500) as recent
    ), '[]'::jsonb)
  );
$$;

create or replace function public.test_missed_matches(
  p_from timestamptz,
  p_to timestamptz,
  p_area text,
  p_test text,
  p_note text,
  p_set text default null
)
returns setof public.test_attempt_answers
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from test_attempt_answers
  where user_id = auth.uid()
    and not is_correct
    and (p_from is null or submitted_at >= p_from)
    and (p_to is null or submitted_at < p_to)
    and (p_area is null or instructional_area = p_area)
    and (p_test is null or source_test_id = p_test)
    and (p_set is null or attempt_id in (select test_attempt_ids_in_set(p_set)))
    and (
      p_note is null
      or (p_note = 'with' and note is not null)
      or (p_note = 'without' and note is null)
    );
$$;

create or replace function public.test_missed_page(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_area text default null,
  p_test text default null,
  p_note text default null,
  p_limit integer default 10,
  p_offset integer default 0,
  p_set text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with matches as (
    select * from test_missed_matches(p_from, p_to, p_area, p_test, p_note, p_set)
  ),
  in_range as (
    select * from test_missed_matches(p_from, p_to, null, null, null, p_set)
  )
  select jsonb_build_object(
    'total', (select count(*) from matches),
    'rows', coalesce((
      select jsonb_agg(row order by submitted_at desc, attempt_id, position)
      from (
        select m.submitted_at, m.attempt_id, m.position,
               jsonb_build_object(
                 'attempt_id', m.attempt_id, 'position', m.position, 'submitted_at', m.submitted_at,
                 'source_test_id', m.source_test_id, 'source_number', m.source_number,
                 'pi_code', m.pi_code, 'instructional_area', m.instructional_area,
                 'user_answer', m.user_answer, 'unanswered', m.unanswered, 'note', m.note,
                 'mode', t.mode, 'test_title', t.test_title, 'question_set', t.question_set
               ) as row
        from matches m
        join test_attempts t on t.id = m.attempt_id
        order by m.submitted_at desc, m.attempt_id, m.position
        limit greatest(1, least(p_limit, 50)) offset greatest(0, p_offset)
      ) as page
    ), '[]'::jsonb),
    'areas', coalesce((select jsonb_agg(distinct instructional_area) from in_range), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(distinct source_test_id) from in_range), '[]'::jsonb)
  );
$$;

create or replace function public.test_missed_refs(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_area text default null,
  p_test text default null,
  p_note text default null,
  p_set text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(ref order by last_missed desc), '[]'::jsonb)
  from (
    select source_test_id || '#' || source_number as ref, max(submitted_at) as last_missed
    from test_missed_matches(p_from, p_to, p_area, p_test, p_note, p_set)
    group by source_test_id, source_number
    limit 5000
  ) as refs;
$$;

create or replace function public.test_history_page(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_mode text default null,
  p_cluster text default null,
  p_sort text default 'newest',
  p_limit integer default 10,
  p_offset integer default 0,
  p_set text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with in_range as (
    select *
    from test_attempts
    where user_id = auth.uid()
      and (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
      and (p_set is null or question_set = p_set)
  ),
  matches as (
    select *
    from in_range
    where (p_mode is null or mode = p_mode)
      and (p_cluster is null or cluster = p_cluster)
  ),
  page as (
    select *
    from matches
    order by
      case when p_sort = 'score-high' then score_pct end desc nulls last,
      case when p_sort = 'score-low' then score_pct end asc nulls last,
      case when p_sort = 'oldest' then submitted_at end asc,
      submitted_at desc,
      id
    limit greatest(1, least(p_limit, 50)) offset greatest(0, p_offset)
  )
  select jsonb_build_object(
    'total', (select count(*) from matches),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'mode', mode, 'test_id', test_id, 'test_title', test_title, 'cluster', cluster,
        'filters', filters, 'submitted_at', submitted_at, 'total', total_questions,
        'correct', correct_count, 'time_taken_seconds', time_taken_seconds, 'question_set', question_set
      ) order by
        case when p_sort = 'score-high' then score_pct end desc nulls last,
        case when p_sort = 'score-low' then score_pct end asc nulls last,
        case when p_sort = 'oldest' then submitted_at end asc,
        submitted_at desc,
        id)
      from page
    ), '[]'::jsonb),
    'clusters', coalesce((select jsonb_agg(distinct cluster) from in_range where cluster is not null), '[]'::jsonb)
  );
$$;

-- Same signature; the attempt now includes its question set.
create or replace function public.test_attempt_detail(p_attempt_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', t.id, 'mode', t.mode, 'test_id', t.test_id, 'test_title', t.test_title, 'cluster', t.cluster,
      'filters', t.filters, 'started_at', t.started_at, 'submitted_at', t.submitted_at,
      'total', t.total_questions, 'answered', t.answered_count, 'correct', t.correct_count,
      'time_taken_seconds', t.time_taken_seconds, 'timed_out', t.timed_out, 'question_set', t.question_set
    ),
    'answers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', a.position, 'source_test_id', a.source_test_id, 'source_number', a.source_number,
        'pi_code', a.pi_code, 'instructional_area', a.instructional_area, 'user_answer', a.user_answer,
        'is_correct', a.is_correct, 'unanswered', a.unanswered, 'note', a.note
      ) order by a.position)
      from test_attempt_answers a
      where a.attempt_id = t.id and a.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  from test_attempts t
  where t.id = p_attempt_id and t.user_id = auth.uid();
$$;

-- Progress on the original practice sets for /practice-questions: per set, the
-- best and latest full-set score; per source set, answered and correct across
-- every attempt (full sets and custom practice).
create or replace function public.original_set_progress()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'sets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'test_id', test_id, 'attempts', attempts, 'best_pct', best_pct, 'last_at', last_at
      ))
      from (
        select test_id, count(*) as attempts, max(score_pct) as best_pct, max(submitted_at) as last_at
        from test_attempts
        where user_id = auth.uid() and question_set = 'original' and mode = 'full'
        group by test_id
      ) as sets
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('test_id', source_test_id, 'answered', answered, 'correct', correct))
      from (
        select source_test_id, count(*) filter (where not unanswered) as answered,
               count(*) filter (where is_correct) as correct
        from test_attempt_answers
        where user_id = auth.uid() and attempt_id in (select test_attempt_ids_in_set('original'))
        group by source_test_id
      ) as sources
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.save_test_attempt(jsonb, jsonb) to authenticated;
grant execute on function public.test_attempt_ids_in_set(text) to authenticated;
grant execute on function public.test_dashboard_overview(timestamptz, timestamptz, text[], text) to authenticated;
grant execute on function public.test_dashboard_compare(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.test_missed_matches(timestamptz, timestamptz, text, text, text, text) to authenticated;
grant execute on function public.test_missed_page(timestamptz, timestamptz, text, text, text, integer, integer, text) to authenticated;
grant execute on function public.test_missed_refs(timestamptz, timestamptz, text, text, text, text) to authenticated;
grant execute on function public.test_history_page(timestamptz, timestamptz, text, text, text, integer, integer, text) to authenticated;
grant execute on function public.test_attempt_detail(uuid) to authenticated;
grant execute on function public.original_set_progress() to authenticated;
