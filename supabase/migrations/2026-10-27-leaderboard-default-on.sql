-- Leaderboard on by default: new accounts start opted in, and appear as soon as
-- they pick a display name (the site asks for one after sign-up). People can
-- still hide themselves from the dashboard's Leaderboard tab.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-10-13-leaderboard.sql. It is safe to run again.

alter table public.profiles alter column leaderboard_opt_in set default true;

-- Existing accounts that never picked a name haven't made a choice yet, so they
-- get the new default too. Anyone with a name keeps what they chose.
update public.profiles
  set leaderboard_opt_in = true
  where display_name is null and not leaderboard_opt_in;
