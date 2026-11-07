-- Usernames, list comments with replies, and comment reports.

-- Profiles: a public username so comments never show someone's real name.
-- Created after sign-in when the user picks a username.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- 3 to 20 letters, numbers or underscores
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

-- "Nick" and "nick" count as the same username
create unique index profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Usernames show on comments, so anyone can read them
create policy "Read profiles"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Create own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


-- Comments on a list. parent_id is set for replies, null for top-level comments.
create table public.comments (
  id bigint generated always as identity primary key,
  list_slug text not null,
  -- Points at profiles, so you need a username before you can comment
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id bigint,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),

  -- A reply must be on the same list as the comment it answers.
  -- Deleting a comment deletes its replies.
  unique (id, list_slug),
  foreign key (parent_id, list_slug) references public.comments (id, list_slug) on delete cascade
);

create index comments_list_created_idx on public.comments (list_slug, created_at);
create index comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

-- Anyone can read comments, even signed out
create policy "Read comments"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "Add own comments"
  on public.comments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Delete own comments"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- Reports: signed-in users flag a comment, you review them in the Supabase dashboard.
create table public.comment_reports (
  id bigint generated always as identity primary key,
  comment_id bigint not null references public.comments (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  -- One report per person per comment
  unique (comment_id, reporter_id)
);

alter table public.comment_reports enable row level security;

-- Users can file reports but nobody can read them through the site
create policy "File reports"
  on public.comment_reports for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);
