-- The Blood Bathroom: "Who would win?" battles between two fighters, voted on by signed-in users.
-- You add fighters and battles in the Supabase table editor, nothing is created from the site.

-- Every fighter, reusable across battles (Jason can fight Michael, then Freddy, then Chucky).
-- image is a path in public/ ('/assets/fighters/jason.png') or a public Supabase Storage URL
create table public.battle_fighters (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 60),
  image text not null check (image ~ '^(/|https://)'),
  created_at timestamptz not null default now()
);

alter table public.battle_fighters enable row level security;

create policy "Read fighters"
  on public.battle_fighters for select
  to anon, authenticated
  using (true);


-- One row per battle. Newest published_at shows first
create table public.battles (
  id bigint generated always as identity primary key,
  -- The page address, /blood-bathroom/<slug>. Leave it empty and it's made from the names,
  -- e.g. 'jason-voorhees-vs-michael-myers'
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  left_fighter_id bigint not null references public.battle_fighters (id),
  right_fighter_id bigint not null references public.battle_fighters (id),
  -- Optional line under the names, e.g. 'Camp Crystal Lake vs Haddonfield'
  tagline text check (char_length(trim(tagline)) between 1 and 140),
  -- 'hidden' pulls a battle off the site
  status text not null default 'published' check (status in ('published', 'hidden')),
  published_at timestamptz not null default now(),
  check (left_fighter_id <> right_fighter_id)
);

create index battles_published_idx on public.battles (status, published_at desc);

alter table public.battles enable row level security;

create policy "Read published battles"
  on public.battles for select
  to anon, authenticated
  using (status = 'published');

-- Fills in the slug from the fighter names when it's left empty
create function public.battles_set_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  left_name text;
  right_name text;
begin
  if new.slug is null or trim(new.slug) = '' then
    select name into left_name from public.battle_fighters where id = new.left_fighter_id;
    select name into right_name from public.battle_fighters where id = new.right_fighter_id;
    new.slug := trim(both '-' from
      regexp_replace(lower(left_name || ' vs ' || right_name), '[^a-z0-9]+', '-', 'g'));
  end if;
  return new;
end;
$$;

create trigger battles_set_slug
  before insert or update of slug, left_fighter_id, right_fighter_id on public.battles
  for each row execute function public.battles_set_slug();


-- One vote per person per battle. Changing sides updates the row
create table public.battle_votes (
  battle_id bigint not null references public.battles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  side text not null check (side in ('left', 'right')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

alter table public.battle_votes enable row level security;

-- People only see their own votes. Totals come from battle_vote_counts() below
create policy "Read own votes"
  on public.battle_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Vote on published battles"
  on public.battle_votes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.battles b where b.id = battle_id and b.status = 'published')
  );

create policy "Change own vote"
  on public.battle_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.battles b where b.id = battle_id and b.status = 'published')
  );

-- Vote totals for the given battles, readable by everyone without exposing who voted
create function public.battle_vote_counts(battle_ids bigint[])
returns table (battle_id bigint, left_votes bigint, right_votes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select v.battle_id,
         count(*) filter (where v.side = 'left'),
         count(*) filter (where v.side = 'right')
  from public.battle_votes v
  join public.battles b on b.id = v.battle_id and b.status = 'published'
  where v.battle_id = any (battle_ids)
  group by v.battle_id;
$$;

revoke execute on function public.battle_vote_counts(bigint[]) from public;
grant execute on function public.battle_vote_counts(bigint[]) to anon, authenticated;


-- Battles have comment threads too: 'battle:<id>', plus 'battle:suggestions' for matchup ideas
alter table public.comments drop constraint comments_thread_format;
alter table public.comments
  add constraint comments_thread_format
  check (thread ~ '^(movie:[0-9]+|list:[a-z0-9-]+|battle:([0-9]+|suggestions))$');


-- The first battle, using the two fighters in public/assets/fighters
with fighters as (
  insert into public.battle_fighters (name, image)
  values
    ('Jason Voorhees', '/assets/fighters/jason-voorhees.png'),
    ('Michael Myers', '/assets/fighters/michael-myers.png')
  returning id, name
)
insert into public.battles (left_fighter_id, right_fighter_id, tagline)
select
  (select id from fighters where name = 'Jason Voorhees'),
  (select id from fighters where name = 'Michael Myers'),
  'Camp Crystal Lake vs Haddonfield';
