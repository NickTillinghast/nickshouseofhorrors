-- Hearted movies, one row per user per movie.
-- Card details are copied in so the profile grid needs no TMDB calls.
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  release_date text,
  overview text,
  vote_average real,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- Profile grid lists newest hearts first
create index favorites_user_created_idx on public.favorites (user_id, created_at desc);

-- Row Level Security: people can only see and change their own hearts,
-- even though the publishable key is visible in the browser
alter table public.favorites enable row level security;

create policy "Read own favorites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Add own favorites"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Remove own favorites"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);
