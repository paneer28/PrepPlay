-- Questions a student flagged to look at again, listed on the dashboard's Tests
-- tab until they remove the flag. A question is flagged or not, whichever
-- attempt it came up in, so flags aren't tied to a saved result.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run). It is safe
-- to run again. Until it's run, flagging shows an error and the dashboard section
-- stays hidden.

create table if not exists public.flagged_questions (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- "<testId>#<number>"
  ref text not null check (char_length(ref) between 3 and 220),
  flagged_at timestamptz not null default now(),
  primary key (user_id, ref)
);

create index if not exists flagged_questions_user_flagged_idx
  on public.flagged_questions (user_id, flagged_at desc);

alter table public.flagged_questions enable row level security;

revoke all on public.flagged_questions from anon;
grant select, insert, delete on public.flagged_questions to authenticated;

drop policy if exists "Students read their own flagged questions" on public.flagged_questions;
create policy "Students read their own flagged questions"
  on public.flagged_questions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students add their own flagged questions" on public.flagged_questions;
create policy "Students add their own flagged questions"
  on public.flagged_questions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students remove their own flagged questions" on public.flagged_questions;
create policy "Students remove their own flagged questions"
  on public.flagged_questions for delete to authenticated
  using ((select auth.uid()) = user_id);
