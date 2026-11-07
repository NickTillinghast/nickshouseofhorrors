-- Leaderboards now show each player's username from profiles, looked up live.
-- Remove the copied Google name and photo: quiz_scores is publicly readable,
-- so they would expose real names even though the page no longer shows them.
-- Run after 003_quiz_modes.sql.

alter table public.quiz_scores drop column display_name;
alter table public.quiz_scores drop column avatar_url;
