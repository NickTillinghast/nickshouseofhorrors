-- Comments belong to a "thread" instead of only a list, so movies can have them too.
-- Thread keys: 'movie:<tmdb id>' for a movie, 'list:<slug>' for a list.
-- The same-thread rule for replies follows the rename automatically.
alter table public.comments rename column list_slug to thread;
alter index public.comments_list_created_idx rename to comments_thread_created_idx;

alter table public.comments
  add constraint comments_thread_format check (thread ~ '^(movie:[0-9]+|list:[a-z0-9-]+)$');
