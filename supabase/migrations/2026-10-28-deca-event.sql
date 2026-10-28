-- Each person's DECA event, picked in the welcome popup or on the dashboard. The
-- site uses it as the starting filter on exams, practice questions and roleplays.
-- Null until they pick one, which is what makes the popup ask.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-10-13-leaderboard.sql. It is safe to run again.

alter table public.profiles add column if not exists deca_event text;

-- Event ids are short slugs like "hrm-series"; the site checks them against its
-- event list (lib/deca-events.ts) before saving.
alter table public.profiles drop constraint if exists profiles_deca_event_format;
alter table public.profiles
  add constraint profiles_deca_event_format
  check (deca_event is null or deca_event ~ '^[a-z0-9-]{1,40}$');
