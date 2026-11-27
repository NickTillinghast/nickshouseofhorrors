-- Nick's pick: one movie featured on the home page, under a heading like 'Best Cheesy Gore'.
-- Added in the Supabase table editor, nothing is created from the site. See docs/nicks-pick.md

create table public.nicks_picks (
  id bigint generated always as identity primary key,
  -- The movie's TMDB id, the number in its address: themoviedb.org/movie/694 → 694
  -- (also the number in nickshouseofhorrors.com/movies/694)
  tmdb_id integer not null check (tmdb_id > 0),
  -- Shown above the card, e.g. 'Best Cheesy Gore' or 'Comedy of Terrors'
  heading text not null check (char_length(trim(heading)) between 1 and 60),
  -- Optional line under the heading: why this one
  note text check (char_length(trim(note)) between 1 and 280),
  -- 'hidden' takes a pick off the site
  status text not null default 'published' check (status in ('published', 'hidden')),
  -- The newest published pick is the one on the home page
  published_at timestamptz not null default now()
);

create index nicks_picks_published_idx on public.nicks_picks (status, published_at desc);

alter table public.nicks_picks enable row level security;

create policy "Read published picks"
  on public.nicks_picks for select
  to anon, authenticated
  using (status = 'published');
