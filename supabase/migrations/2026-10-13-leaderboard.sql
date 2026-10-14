-- Leaderboard: opt-in display names on profiles, and the functions behind the
-- dashboard's Leaderboard tab. People are ranked by practice questions answered
-- (this week, or all time). Nobody appears until they pick a display name and
-- turn the leaderboard on; emails are never exposed.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- setup.sql and 2026-10-08-test-results.sql. It is safe to run again: every
-- statement is idempotent.

-- ---------------------------------------------------------------------------
-- Profile columns
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists leaderboard_opt_in boolean not null default false;

-- 3 to 20 characters: letters, numbers, spaces, dots, dashes and underscores,
-- starting with a letter or number. Matches validDisplayName() in lib/leaderboard.ts.
alter table public.profiles drop constraint if exists profiles_display_name_format;
alter table public.profiles
  add constraint profiles_display_name_format
  check (display_name is null or display_name ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{2,19}$');

-- Names are unique regardless of case ("Ace" and "ace" can't both exist).
create unique index if not exists profiles_display_name_unique_idx
  on public.profiles (lower(display_name));

-- ---------------------------------------------------------------------------
-- Totals (internal)
-- ---------------------------------------------------------------------------

-- Questions answered per person since p_since (null = all time). Results are
-- scored in the browser, so each attempt counts at most its own question count
-- (and never more than 200), and only when it was open for at least 2 seconds
-- per answered question. Not callable from the site directly.
create or replace function public.leaderboard_totals(p_since timestamptz)
returns table (user_id uuid, questions bigint)
language sql
stable
security definer
set search_path = public
as $$
  select a.user_id, sum(least(a.answered_count, a.total_questions, 200))::bigint
  from test_attempts a
  where (p_since is null or a.submitted_at >= p_since)
    and a.submitted_at <= now() + interval '5 minutes'
    and a.submitted_at - a.started_at >= make_interval(secs => least(a.answered_count, a.total_questions) * 2)
  group by a.user_id
$$;

revoke execute on function public.leaderboard_totals(timestamptz) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Functions the site calls
-- ---------------------------------------------------------------------------

-- The top p_limit opted-in people for 'week' (since Monday 00:00 UTC) or 'all',
-- plus the caller's own row when they're opted in but outside the top. Ties
-- share a rank. Signed-in callers only.
create or replace function public.get_leaderboard(p_period text default 'week', p_limit integer default 50)
returns table (rank bigint, display_name text, questions bigint, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      rank() over (order by t.questions desc) as rank,
      p.display_name,
      t.questions,
      t.user_id = auth.uid() as is_me
    from leaderboard_totals(case when p_period = 'all' then null else date_trunc('week', now()) end) t
    join profiles p on p.id = t.user_id
    where p.leaderboard_opt_in and p.display_name is not null and t.questions > 0
  )
  select rank, display_name, questions, is_me
  from ranked
  where auth.uid() is not null
    and (rank <= least(greatest(p_limit, 1), 100) or is_me)
  order by rank, lower(display_name)
$$;

revoke execute on function public.get_leaderboard(text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

-- The caller's own leaderboard settings and question counts, whether or not
-- they've opted in (so the tab can say "You've answered 140 this week").
create or replace function public.get_my_leaderboard_status()
returns table (display_name text, opted_in boolean, week_questions bigint, all_questions bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.display_name,
    coalesce(p.leaderboard_opt_in, false),
    coalesce((select w.questions from leaderboard_totals(date_trunc('week', now())) w where w.user_id = auth.uid()), 0),
    coalesce((select t.questions from leaderboard_totals(null) t where t.user_id = auth.uid()), 0)
  from (select auth.uid() as id) me
  left join profiles p on p.id = me.id
  where me.id is not null
$$;

revoke execute on function public.get_my_leaderboard_status() from public, anon;
grant execute on function public.get_my_leaderboard_status() to authenticated;

-- Sets the caller's display name and whether they appear. Returns 'saved',
-- 'taken' (name in use), 'invalid' (fails the format) or 'missing-name'
-- (opting in without a name).
create or replace function public.set_leaderboard_profile(p_display_name text, p_opt_in boolean)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := nullif(btrim(regexp_replace(coalesce(p_display_name, ''), '\s+', ' ', 'g')), '');
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if v_name is not null and v_name !~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{2,19}$' then
    return 'invalid';
  end if;
  if p_opt_in and v_name is null then
    return 'missing-name';
  end if;

  -- Profiles are created at sign-up; the insert only covers accounts made before that.
  insert into profiles (id, email, display_name, leaderboard_opt_in)
  values (v_user, coalesce(auth.jwt() ->> 'email', ''), v_name, p_opt_in)
  on conflict (id) do update
    set display_name = excluded.display_name,
        leaderboard_opt_in = excluded.leaderboard_opt_in;

  return 'saved';
exception
  when unique_violation then
    return 'taken';
end;
$$;

revoke execute on function public.set_leaderboard_profile(text, boolean) from public, anon;
grant execute on function public.set_leaderboard_profile(text, boolean) to authenticated;
