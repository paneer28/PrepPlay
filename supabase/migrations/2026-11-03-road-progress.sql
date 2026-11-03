-- Progress on the Exams and Roleplays roads that isn't a test answer: flashcards
-- learned, checkpoints passed and mini roleplays finished. Question scores come
-- from test_attempt_answers, so they aren't stored here.
--
-- Run once in the Supabase SQL Editor (paste the whole file, then Run). It is safe
-- to run again. Until it's run, this progress stays in the student's browser.

create table if not exists public.road_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- "card:BL:001", "pi:BL:001", "checkpoint:<unit>", "mini:HRM:districts"
  item text not null check (char_length(item) between 1 and 120),
  done_at timestamptz not null default now(),
  primary key (user_id, item)
);

alter table public.road_progress enable row level security;

drop policy if exists "Students read their own road progress" on public.road_progress;
create policy "Students read their own road progress"
  on public.road_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Students add their own road progress" on public.road_progress;
create policy "Students add their own road progress"
  on public.road_progress for insert
  with check (auth.uid() = user_id);
