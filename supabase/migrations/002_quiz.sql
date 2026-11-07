-- Horror trivia: one row per quiz played, and one leaderboard row per player.
-- Only the server (secret key) writes these, so nobody can post a fake score from the browser.

-- A quiz in progress or finished. Anyone can play, so user_id is optional
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  -- Question ids in the order this player gets them
  question_order integer[] not null,
  current_index integer not null default 0,
  correct_count integer not null default 0,
  -- When the current question was shown; the clock only runs while a question is on screen
  question_shown_at timestamptz,
  -- Total thinking time across all questions
  duration_ms integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  saved boolean not null default false
);

-- Row Level Security on with no policies: only the server's secret key can read or write
alter table public.quiz_attempts enable row level security;

-- Each signed-in player's best score: most correct, then fastest
create table public.quiz_scores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  correct integer not null,
  total integer not null,
  duration_ms integer not null,
  achieved_at timestamptz not null default now()
);

create index quiz_scores_rank_idx on public.quiz_scores (correct desc, duration_ms asc);

-- Everyone can see the leaderboard, only the server can write to it
alter table public.quiz_scores enable row level security;

create policy "Leaderboard is public"
  on public.quiz_scores for select
  to anon, authenticated
  using (true);
