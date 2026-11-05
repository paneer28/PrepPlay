-- Per-user totals for the /dev/users page. Students can only read their own
-- results, so this function runs with elevated rights and refuses anyone who
-- isn't a developer (is_prepplay_developer, 2026-10-29-share-quizzes.sql).
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-11-05-flagged-questions.sql. It is safe to run again.

create or replace function public.developer_user_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_prepplay_developer() then
    raise exception 'developers only' using errcode = '42501';
  end if;

  with answers as (
    -- Questions left blank don't count as answered.
    select user_id,
           count(*) filter (where not unanswered) as answered,
           count(*) filter (where is_correct) as correct
    from test_attempt_answers
    group by user_id
  ),
  attempts as (
    select user_id,
           count(*) filter (where mode = 'full') as full_tests,
           count(*) filter (where mode = 'custom') as custom_sessions,
           max(score_pct) filter (where mode = 'full') as best_full_pct,
           max(submitted_at) as last_at
    from test_attempts
    group by user_id
  ),
  roleplays as (
    select user_id,
           count(*) as generated_count,
           count(submitted_at) as judged_count,
           max(submitted_at) as last_at
    from generated_roleplays
    group by user_id
  ),
  flags as (
    select user_id, count(*) as flagged
    from flagged_questions
    group by user_id
  ),
  stats as (
    select p.id, p.email, p.display_name, p.deca_event, p.created_at,
           coalesce(an.answered, 0) as answered,
           coalesce(an.correct, 0) as correct,
           coalesce(at.full_tests, 0) as full_tests,
           coalesce(at.custom_sessions, 0) as custom_sessions,
           at.best_full_pct,
           coalesce(r.generated_count, 0) as roleplays_generated,
           coalesce(r.judged_count, 0) as roleplays_judged,
           coalesce(f.flagged, 0) as flagged,
           greatest(at.last_at, r.last_at) as last_active
    from profiles p
    left join answers an on an.user_id = p.id
    left join attempts at on at.user_id = p.id
    left join roleplays r on r.user_id = p.id
    left join flags f on f.user_id = p.id
  )
  select coalesce(
    jsonb_agg(to_jsonb(stats) order by stats.last_active desc nulls last, stats.created_at desc),
    '[]'::jsonb
  )
  into v_result
  from stats;

  return v_result;
end;
$$;

revoke all on function public.developer_user_stats() from public, anon;
grant execute on function public.developer_user_stats() to authenticated;
