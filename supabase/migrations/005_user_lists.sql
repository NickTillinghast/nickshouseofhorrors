-- Fan Top 10 lists: paid lists, their movies, payments, and the promoted-spot queue.
-- Lists are only created by the server after a payment, never straight from the browser.

-- One row per list. A list starts as a paid draft, the owner fills it in, then publishes it.
-- Published lists are final: no edits, make a new list instead.
create table public.user_lists (
  id bigint generated always as identity primary key,
  -- Points at profiles, so the list can show "Picked by {username}"
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Empty until the owner names the draft
  title text check (char_length(trim(title)) between 1 and 60),
  -- Up to 3 subgenre ids from horrorFilters.json, used by the genre filter on /lists
  genre_ids integer[] not null default '{}' check (cardinality(genre_ids) <= 3),
  -- 'hidden' is for you: set it in the dashboard to pull a list off the site
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  -- Your own Top 10, shown first on /lists. Only settable from the dashboard
  is_featured boolean not null default false,
  -- Promoted days paid for but not booked yet; booked when the list is published
  promo_days_owed integer not null default 0 check (promo_days_owed >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A published list always has a title
  check (status = 'draft' or title is not null)
);

create index user_lists_published_idx on public.user_lists (status, published_at desc);
create index user_lists_user_idx on public.user_lists (user_id, created_at desc);
create index user_lists_genres_idx on public.user_lists using gin (genre_ids);

alter table public.user_lists enable row level security;

-- Everyone sees published lists, owners also see their own drafts.
-- There are no insert/update/delete policies: the server creates and publishes lists,
-- and owners edit drafts only through save_user_list() below
create policy "Read published or own lists"
  on public.user_lists for select
  to anon, authenticated
  using (status = 'published' or (select auth.uid()) = user_id);


-- The movies on a list, in rank order. Card details are copied in so pages need no TMDB calls
create table public.user_list_movies (
  list_id bigint not null references public.user_lists (id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  tmdb_id integer not null check (tmdb_id > 0),
  title text not null check (char_length(title) between 1 and 500),
  poster_path text,
  release_date text,
  vote_average real,
  primary key (list_id, position),
  -- The same movie can't be on a list twice
  unique (list_id, tmdb_id)
);

alter table public.user_list_movies enable row level security;

create policy "Read movies on visible lists"
  on public.user_list_movies for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.user_lists l
      where l.id = list_id
        and (l.status = 'published' or l.user_id = (select auth.uid()))
    )
  );


-- Every purchase. provider is 'fake' while testing, 'stripe' later
create table public.list_payments (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.user_lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('first_list', 'extra_list', 'promote_30')),
  amount_cents integer not null check (amount_cents >= 0),
  provider text not null default 'fake',
  -- The payment provider's id for this charge, e.g. a Stripe Checkout session
  provider_ref text,
  created_at timestamptz not null default now()
);

create index list_payments_user_idx on public.list_payments (user_id);

alter table public.list_payments enable row level security;

-- People can see their own payments, only the server writes them
create policy "Read own payments"
  on public.list_payments for select
  to authenticated
  using ((select auth.uid()) = user_id);


-- The promoted spots on /lists. Each spot is a lane, and promotions in a lane never overlap,
-- so a paid promotion waits its turn instead of pushing someone else out
create table public.list_promotions (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.user_lists (id) on delete cascade,
  payment_id bigint references public.list_payments (id) on delete set null,
  lane smallint not null check (lane in (1, 2)),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);

create index list_promotions_ends_idx on public.list_promotions (ends_at);
create index list_promotions_list_idx on public.list_promotions (list_id);

alter table public.list_promotions enable row level security;

create policy "Read promotions on visible lists"
  on public.list_promotions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.user_lists l
      where l.id = list_id
        and (l.status = 'published' or l.user_id = (select auth.uid()))
    )
  );


-- Saves a draft's title, genres and movies in one go, so a reorder can never half-save.
-- Runs with full access, so it checks for itself that the caller owns the draft
create function public.save_user_list(
  p_list_id bigint,
  p_title text,
  p_genre_ids integer[],
  p_movies jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_lists
    where id = p_list_id and user_id = (select auth.uid()) and status = 'draft'
  ) then
    raise exception 'Not your draft' using errcode = '42501';
  end if;

  if jsonb_typeof(p_movies) <> 'array' or jsonb_array_length(p_movies) > 10 then
    raise exception 'A list holds up to 10 movies' using errcode = '22023';
  end if;

  update public.user_lists
  set title = nullif(trim(p_title), ''),
      genre_ids = coalesce(p_genre_ids, '{}'),
      updated_at = now()
  where id = p_list_id;

  delete from public.user_list_movies where list_id = p_list_id;

  insert into public.user_list_movies
    (list_id, position, tmdb_id, title, poster_path, release_date, vote_average)
  select
    p_list_id,
    t.ord,
    (t.m ->> 'id')::integer,
    t.m ->> 'title',
    t.m ->> 'poster_path',
    t.m ->> 'release_date',
    (t.m ->> 'vote_average')::real
  from jsonb_array_elements(p_movies) with ordinality as t(m, ord);
end;
$$;

revoke execute on function public.save_user_list(bigint, text, integer[], jsonb) from public, anon;
grant execute on function public.save_user_list(bigint, text, integer[], jsonb) to authenticated;


-- When the next promotion for a list would run and in which lane, without booking it.
-- Starts at the latest of: now, when the lane frees up, when this list's own promotion ends
-- (so one list never fills both spots at once)
create function public.next_promotion_slot(p_list_id bigint, out lane smallint, out starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  lane1_free timestamptz;
  lane2_free timestamptz;
  own_end timestamptz;
  start1 timestamptz;
  start2 timestamptz;
begin
  select max(p.ends_at) into lane1_free from public.list_promotions p where p.lane = 1;
  select max(p.ends_at) into lane2_free from public.list_promotions p where p.lane = 2;
  select max(p.ends_at) into own_end from public.list_promotions p where p.list_id = p_list_id;

  start1 := greatest(now(), coalesce(lane1_free, now()), coalesce(own_end, now()));
  start2 := greatest(now(), coalesce(lane2_free, now()), coalesce(own_end, now()));

  if start1 <= start2 then
    lane := 1;
    starts_at := start1;
  else
    lane := 2;
    starts_at := start2;
  end if;
end;
$$;

-- Books a paid promotion into the queue. The lock makes two purchases at the same moment
-- take turns, so they can't be given the same time slot
create function public.book_promotion(p_list_id bigint, p_days integer, p_payment_id bigint)
returns public.list_promotions
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot record;
  booked public.list_promotions;
begin
  lock table public.list_promotions in share row exclusive mode;

  select * into slot from public.next_promotion_slot(p_list_id);

  insert into public.list_promotions (list_id, payment_id, lane, starts_at, ends_at)
  values (p_list_id, p_payment_id, slot.lane, slot.starts_at, slot.starts_at + make_interval(days => p_days))
  returning * into booked;

  return booked;
end;
$$;

-- Only the server (secret key) can preview or book promotions
revoke execute on function public.next_promotion_slot(bigint) from public, anon, authenticated;
revoke execute on function public.book_promotion(bigint, integer, bigint) from public, anon, authenticated;
grant execute on function public.next_promotion_slot(bigint) to service_role;
grant execute on function public.book_promotion(bigint, integer, bigint) to service_role;
