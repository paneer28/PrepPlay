-- Notes belong to a question, not to one attempt at it, so the Got wrong and
-- Flagged lists share a single note per question. Existing notes are copied
-- over (the old test_attempt_answers.note column is left as it was), and the
-- dashboard gets two reads for its redesigned Review and history sections.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-11-05-flagged-questions.sql. It is safe to run again: notes already
-- copied or written since are never overwritten.

create table if not exists public.question_notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- "<testId>#<number>"; the app stores the first copy of a question that
  -- appears on several tests.
  ref text not null check (char_length(ref) between 3 and 220),
  note text not null check (char_length(note) between 1 and 4000),
  updated_at timestamptz not null default now(),
  primary key (user_id, ref)
);

alter table public.question_notes enable row level security;

revoke all on public.question_notes from anon;
grant select, insert, update, delete on public.question_notes to authenticated;

drop policy if exists "Students read their own question notes" on public.question_notes;
create policy "Students read their own question notes"
  on public.question_notes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students add their own question notes" on public.question_notes;
create policy "Students add their own question notes"
  on public.question_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students edit their own question notes" on public.question_notes;
create policy "Students edit their own question notes"
  on public.question_notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students remove their own question notes" on public.question_notes;
create policy "Students remove their own question notes"
  on public.question_notes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Copy every existing note. A question missed (and noted) more than once keeps
-- each different note, newest first.
insert into public.question_notes (user_id, ref, note, updated_at)
select user_id, ref, left(string_agg(note, E'\n\n' order by last_at desc), 4000), max(last_at)
from (
  select user_id,
         source_test_id || '#' || source_number as ref,
         btrim(note) as note,
         max(coalesce(note_updated_at, submitted_at)) as last_at
  from public.test_attempt_answers
  where note is not null and btrim(note) <> ''
  group by user_id, source_test_id, source_number, btrim(note)
) as distinct_notes
group by user_id, ref
on conflict (user_id, ref) do nothing;

-- One row per missed question in range: how often it was missed and the most
-- recent miss. Filtering, notes and duplicate copies are handled in the app.
create or replace function public.test_missed_questions(
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
  with misses as (
    select * from test_missed_matches(p_from, p_to, null, null, null, p_set)
  ),
  latest as (
    select distinct on (source_test_id, source_number)
           source_test_id, source_number, instructional_area, attempt_id, position,
           user_answer, unanswered, submitted_at
    from misses
    order by source_test_id, source_number, submitted_at desc, attempt_id, position desc
  ),
  counts as (
    select source_test_id, source_number, count(*) as missed
    from misses
    group by source_test_id, source_number
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'source_test_id', l.source_test_id, 'source_number', l.source_number,
           'area', l.instructional_area, 'missed', c.missed, 'last_missed', l.submitted_at,
           'attempt_id', l.attempt_id, 'position', l.position,
           'user_answer', l.user_answer, 'unanswered', l.unanswered
         ) order by l.submitted_at desc), '[]'::jsonb)
  from (select * from latest order by submitted_at desc limit 5000) as l
  join counts c on c.source_test_id = l.source_test_id and c.source_number = l.source_number;
$$;

-- Every attempt in range, newest first, so the history list can group a day's
-- Infinite sessions together before paging.
create or replace function public.test_history_all(
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
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'mode', mode, 'test_id', test_id, 'test_title', test_title, 'cluster', cluster,
           'filters', filters, 'submitted_at', submitted_at, 'total', total_questions,
           'correct', correct_count, 'time_taken_seconds', time_taken_seconds, 'question_set', question_set
         ) order by submitted_at desc, id), '[]'::jsonb)
  from (
    select *
    from test_attempts
    where user_id = auth.uid()
      and (p_from is null or submitted_at >= p_from)
      and (p_to is null or submitted_at < p_to)
      and (p_set is null or question_set = p_set)
    order by submitted_at desc, id
    limit 5000
  ) as recent;
$$;

grant execute on function public.test_missed_questions(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.test_history_all(timestamptz, timestamptz, text) to authenticated;
