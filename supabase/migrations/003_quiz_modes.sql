-- Four quiz lengths (Jump Scare 10, Midnight Movie 25, Final Girl 50, Unkillable 100), each with its own leaderboard.
-- Run after 002_quiz.sql.

alter table public.quiz_attempts
  add column mode text not null default 'final-girl'
  check (mode in ('jump-scare', 'midnight-movie', 'final-girl', 'unkillable'));

-- A player now has one best score per quiz length instead of one overall
alter table public.quiz_scores
  add column mode text not null default 'final-girl'
  check (mode in ('jump-scare', 'midnight-movie', 'final-girl', 'unkillable'));

alter table public.quiz_scores drop constraint quiz_scores_pkey;
alter table public.quiz_scores add primary key (user_id, mode);

drop index if exists public.quiz_scores_rank_idx;
create index quiz_scores_rank_idx on public.quiz_scores (mode, correct desc, duration_ms asc);

-- Cleanup of quizzes nobody finished (or finished but never saved) looks these up by age
create index quiz_attempts_cleanup_idx on public.quiz_attempts (started_at) where saved = false;
