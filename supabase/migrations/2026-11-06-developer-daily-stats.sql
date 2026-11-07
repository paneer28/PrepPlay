-- Accounts created and questions answered per day, for the /dev/users page.
-- Like developer_user_stats, it runs with elevated rights and refuses anyone
-- who isn't a developer.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run), after
-- 2026-11-05-developer-user-stats.sql. It is safe to run again.

create or replace function public.developer_daily_stats(p_time_zone text default 'UTC', p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz text := 'UTC';
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 366);
  v_today date;
  v_result jsonb;
begin
  if not public.is_prepplay_developer() then
    raise exception 'developers only' using errcode = '42501';
  end if;

  -- Days are counted in the viewer's time zone; an unknown name falls back to UTC.
  if exists (select 1 from pg_timezone_names where name = p_time_zone) then
    v_tz := p_time_zone;
  end if;
  v_today := (now() at time zone v_tz)::date;

  with days as (
    select v_today - offset_days as day
    from generate_series(0, v_days - 1) as offset_days
  ),
  accounts as (
    select (created_at at time zone v_tz)::date as day, count(*) as accounts
    from profiles
    where created_at >= ((v_today - (v_days - 1))::timestamp at time zone v_tz)
    group by 1
  ),
  answered as (
    -- Questions left blank don't count as answered.
    select (submitted_at at time zone v_tz)::date as day, count(*) as answered
    from test_attempt_answers
    where not unanswered
      and submitted_at >= ((v_today - (v_days - 1))::timestamp at time zone v_tz)
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object(
             'day', d.day,
             'accounts', coalesce(a.accounts, 0),
             'answered', coalesce(q.answered, 0)
           )
           order by d.day desc
         )
  into v_result
  from days d
  left join accounts a on a.day = d.day
  left join answered q on q.day = d.day;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.developer_daily_stats(text, integer) from public, anon;
grant execute on function public.developer_daily_stats(text, integer) to authenticated;
