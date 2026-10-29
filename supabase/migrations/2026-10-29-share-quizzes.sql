-- Share quizzes: short quizzes made on /dev and opened from a QR code at
-- /q/<id>. Anyone with the link can take one without an account; only
-- developers (is_prepplay_developer below, also DEVELOPER_EMAILS in
-- lib/share-quizzes.ts) can make or change them.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run). It is
-- safe to run again.

-- ---------------------------------------------------------------------------
-- Who counts as a developer
-- ---------------------------------------------------------------------------

create or replace function public.is_prepplay_developer()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') in ('eppendeyala@gmail.com'), false);
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.share_quizzes (
  -- Short random slug used in the link, e.g. "k7m2qx9a".
  id text primary key check (id ~ '^[a-z0-9]{6,16}$'),
  title text not null check (char_length(title) between 1 and 80),
  -- Where questions come from: every question on these tests, narrowed to
  -- these instructional areas (empty = all)...
  test_ids text[] not null default '{}',
  areas text[] not null default '{}',
  -- ...or exactly these "<testId>#<number>" questions when not empty.
  question_refs text[] not null default '{}',
  -- How many each visitor gets, drawn at random from the pool.
  question_count integer not null default 10 check (question_count between 1 and 50),
  active boolean not null default true,
  -- Finished runs, for the dev page.
  plays integer not null default 0,
  correct_total integer not null default 0,
  answered_total integer not null default 0,
  created_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists share_quizzes_touch_updated_at on public.share_quizzes;
create trigger share_quizzes_touch_updated_at
  before update on public.share_quizzes
  for each row execute procedure public.touch_updated_at();

alter table public.share_quizzes enable row level security;

-- Anyone can open an active quiz (the link is the invitation); developers see all.
drop policy if exists "Anyone can view active share quizzes" on public.share_quizzes;
create policy "Anyone can view active share quizzes"
  on public.share_quizzes
  for select
  to anon, authenticated
  using (active or public.is_prepplay_developer());

drop policy if exists "Developers can create share quizzes" on public.share_quizzes;
create policy "Developers can create share quizzes"
  on public.share_quizzes
  for insert
  to authenticated
  with check (public.is_prepplay_developer());

drop policy if exists "Developers can update share quizzes" on public.share_quizzes;
create policy "Developers can update share quizzes"
  on public.share_quizzes
  for update
  to authenticated
  using (public.is_prepplay_developer())
  with check (public.is_prepplay_developer());

drop policy if exists "Developers can delete share quizzes" on public.share_quizzes;
create policy "Developers can delete share quizzes"
  on public.share_quizzes
  for delete
  to authenticated
  using (public.is_prepplay_developer());

-- ---------------------------------------------------------------------------
-- Count a finished run (called by visitors, signed in or not)
-- ---------------------------------------------------------------------------

create or replace function public.record_share_quiz_play(p_id text, p_correct integer, p_total integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_total is null or p_total < 1 or p_total > 50 or p_correct is null or p_correct < 0 or p_correct > p_total then
    return;
  end if;

  update public.share_quizzes
    set plays = plays + 1,
        correct_total = correct_total + p_correct,
        answered_total = answered_total + p_total
    where id = p_id and active;
end;
$$;

revoke all on function public.record_share_quiz_play(text, integer, integer) from public;
grant execute on function public.record_share_quiz_play(text, integer, integer) to anon, authenticated;
