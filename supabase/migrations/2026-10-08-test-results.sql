-- Practice test results per account: one row per submitted attempt plus one row
-- per question in it, and the read functions behind the dashboard's Tests tab.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run). It is
-- safe to run again: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.test_attempts (
  -- Generated in the browser so a retried save (or a later import of the same
  -- result) can never create a duplicate.
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  mode text not null check (mode in ('full', 'custom')),
  test_id text,
  test_title text,
  -- Full tests: the test's cluster. Custom sessions: the cluster when every
  -- question came from one cluster, otherwise null.
  cluster text,
  -- Custom sessions: { summary, selections } from the filter screen.
  filters jsonb,
  started_at timestamptz not null,
  submitted_at timestamptz not null,
  total_questions integer not null check (total_questions > 0),
  answered_count integer not null check (answered_count >= 0),
  correct_count integer not null check (correct_count >= 0),
  score_pct numeric(5, 2) generated always as (round(correct_count * 100.0 / total_questions, 2)) stored,
  -- Seconds the exam was actually open; null for results saved before this was tracked.
  time_taken_seconds integer check (time_taken_seconds >= 0),
  timed_out boolean not null default false,
  created_at timestamptz not null default now(),
  check ((mode = 'full') = (test_id is not null))
);

create index if not exists test_attempts_user_submitted_idx
  on public.test_attempts (user_id, submitted_at desc);

create index if not exists test_attempts_user_test_submitted_idx
  on public.test_attempts (user_id, test_id, submitted_at desc);

create table if not exists public.test_attempt_answers (
  attempt_id uuid not null references public.test_attempts on delete cascade,
  -- Question number within the attempt (1..N).
  position integer not null check (position > 0),
  -- Copied from the attempt so per-user, per-date statistics need no join.
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  submitted_at timestamptz not null,
  source_test_id text not null,
  source_number integer not null,
  pi_code text not null,
  instructional_area text not null,
  user_answer text check (user_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  -- Unanswered questions are stored as incorrect, with this flag set.
  unanswered boolean not null,
  note text check (char_length(note) <= 500),
  note_updated_at timestamptz,
  primary key (attempt_id, position)
);

create index if not exists test_attempt_answers_user_submitted_idx
  on public.test_attempt_answers (user_id, submitted_at desc);

create index if not exists test_attempt_answers_user_area_idx
  on public.test_attempt_answers (user_id, instructional_area);

create index if not exists test_attempt_answers_user_missed_idx
  on public.test_attempt_answers (user_id, submitted_at desc)
  where not is_correct;

-- ---------------------------------------------------------------------------
-- Access: users see, add, and delete only their own results, and may edit only notes.
-- ---------------------------------------------------------------------------

alter table public.test_attempts enable row level security;
alter table public.test_attempt_answers enable row level security;

revoke update, delete on public.test_attempts from anon, authenticated;
revoke update, delete on public.test_attempt_answers from anon, authenticated;
grant select, insert, delete on public.test_attempts to authenticated;
grant select, insert on public.test_attempt_answers to authenticated;
grant update (note, note_updated_at) on public.test_attempt_answers to authenticated;

drop policy if exists "Users can view their own test attempts" on public.test_attempts;
create policy "Users can view their own test attempts"
  on public.test_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own test attempts" on public.test_attempts;
create policy "Users can insert their own test attempts"
  on public.test_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Deleting an attempt removes its answers too (on delete cascade).
drop policy if exists "Users can delete their own test attempts" on public.test_attempts;
create policy "Users can delete their own test attempts"
  on public.test_attempts for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own test answers" on public.test_attempt_answers;
create policy "Users can view their own test answers"
  on public.test_attempt_answers for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own test answers" on public.test_attempt_answers;
create policy "Users can insert their own test answers"
  on public.test_attempt_answers for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update notes on their own test answers" on public.test_attempt_answers;
create policy "Users can update notes on their own test answers"
  on public.test_attempt_answers for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Writes. Functions run as the calling user (security invoker), so the
-- policies above still apply.
-- ---------------------------------------------------------------------------

-- Saves an attempt and its answers in one transaction. Returns false if this
-- attempt id was already saved (nothing is changed in that case).
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
    total_questions, answered_count, correct_count, time_taken_seconds, timed_out
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
    coalesce((p_attempt ->> 'timed_out')::boolean, false)
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

create or replace function public.set_test_answer_note(p_attempt_id uuid, p_position integer, p_note text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update test_attempt_answers
  set note = nullif(btrim(p_note), ''),
      note_updated_at = now()
  where attempt_id = p_attempt_id
    and position = p_position
    and user_id = auth.uid();

  return found;
end;
$$;

-- Deletes one of the caller's attempts (and, by cascade, its answers and notes).
create or replace function public.delete_test_attempt(p_attempt_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from test_attempts
  where id = p_attempt_id
    and user_id = auth.uid();

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reads for the dashboard. Each returns one JSON document with totals already
-- aggregated, so the browser never receives raw answer rows. p_from / p_to
-- bound submitted_at (null = unbounded).
-- ---------------------------------------------------------------------------

-- Summary cards, per-area and per-PI success rates, and quick-pick tag counts.
create or replace function public.test_dashboard_overview(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_tags text[] default '{}'
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
  ),
  attempts as (
    select mode, score_pct
    from test_attempts
    where user_id = auth.uid()
      and (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
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

-- Compare tests: the latest attempt of each full test in range (with its
-- attempt number across all time), per-area cells for those attempts, and
-- every full attempt in range for the score trend.
create or replace function public.test_dashboard_compare(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with numbered as (
    select id, test_id, test_title, cluster, submitted_at, total_questions, correct_count,
           row_number() over (partition by test_id order by submitted_at, id) as attempt_number
    from test_attempts
    where user_id = auth.uid() and mode = 'full'
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
        'attempt_number', attempt_number
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

-- Shared filter for the missed-questions list and its practice session.
create or replace function public.test_missed_matches(
  p_from timestamptz,
  p_to timestamptz,
  p_area text,
  p_test text,
  p_note text
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
    and (
      p_note is null
      or (p_note = 'with' and note is not null)
      or (p_note = 'without' and note is null)
    );
$$;

-- One page of missed questions, newest first, plus the total and the filter options.
create or replace function public.test_missed_page(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_area text default null,
  p_test text default null,
  p_note text default null,
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with matches as (
    select * from test_missed_matches(p_from, p_to, p_area, p_test, p_note)
  ),
  in_range as (
    select * from test_missed_matches(p_from, p_to, null, null, null)
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
                 'mode', t.mode, 'test_title', t.test_title
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

-- Every distinct missed question matching the filters, as "testId#number" refs
-- for a practice session (most recently missed first).
create or replace function public.test_missed_refs(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_area text default null,
  p_test text default null,
  p_note text default null
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
    from test_missed_matches(p_from, p_to, p_area, p_test, p_note)
    group by source_test_id, source_number
    limit 5000
  ) as refs;
$$;

-- One page of attempt history plus the total and the clusters available to filter by.
create or replace function public.test_history_page(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_mode text default null,
  p_cluster text default null,
  p_sort text default 'newest',
  p_limit integer default 10,
  p_offset integer default 0
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
        'correct', correct_count, 'time_taken_seconds', time_taken_seconds
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

-- Everything the attempt detail view needs: the attempt and all of its answers.
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
      'time_taken_seconds', t.time_taken_seconds, 'timed_out', t.timed_out
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

grant execute on function public.save_test_attempt(jsonb, jsonb) to authenticated;
grant execute on function public.set_test_answer_note(uuid, integer, text) to authenticated;
grant execute on function public.delete_test_attempt(uuid) to authenticated;
grant execute on function public.test_dashboard_overview(timestamptz, timestamptz, text[]) to authenticated;
grant execute on function public.test_dashboard_compare(timestamptz, timestamptz) to authenticated;
grant execute on function public.test_missed_matches(timestamptz, timestamptz, text, text, text) to authenticated;
grant execute on function public.test_missed_page(timestamptz, timestamptz, text, text, text, integer, integer) to authenticated;
grant execute on function public.test_missed_refs(timestamptz, timestamptz, text, text, text) to authenticated;
grant execute on function public.test_history_page(timestamptz, timestamptz, text, text, text, integer, integer) to authenticated;
grant execute on function public.test_attempt_detail(uuid) to authenticated;
