import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

export const USER_LISTS_TAG = "user-lists";

export * from "./userListShared";
import type { PromotedList, UserList } from "./userListShared";

// Public reads (Row Level Security only shows published lists), no login cookie needed
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// The columns a list box needs, with its movies in rank order and the owner's username
export const LIST_SELECT =
  "id, title, genre_ids, published_at, profiles(username), user_list_movies(position, tmdb_id, title, poster_path, release_date, vote_average)";

export type ListRow = {
  id: number;
  title: string | null;
  genre_ids: number[];
  published_at: string | null;
  profiles: { username: string } | null;
  user_list_movies: {
    position: number;
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    release_date: string | null;
    vote_average: number | null;
  }[];
};

export function toUserList(row: ListRow): UserList {
  return {
    id: row.id,
    title: row.title ?? "Untitled list",
    genreIds: row.genre_ids,
    username: row.profiles?.username ?? "Nameless Victim",
    publishedAt: row.published_at,
    movies: [...row.user_list_movies]
      .sort((a, b) => a.position - b.position)
      .map((movie) => ({
        id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      })),
  };
}

// Every published fan list, newest first. Your featured list is shown separately
export async function getPublishedLists(genreId?: number): Promise<UserList[]> {
  "use cache";
  cacheTag(USER_LISTS_TAG);
  cacheLife("hours");

  let query = publicClient()
    .from("user_lists")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("is_featured", false)
    .order("published_at", { ascending: false })
    .limit(100);
  if (genreId) query = query.contains("genre_ids", [genreId]);

  const { data } = await query.overrideTypes<ListRow[], { merge: false }>();
  return (data ?? []).map(toUserList);
}

// Your own Top 10 (is_featured set in the dashboard)
export async function getFeaturedList(): Promise<UserList | null> {
  "use cache";
  cacheTag(USER_LISTS_TAG);
  cacheLife("hours");

  const { data } = await publicClient()
    .from("user_lists")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .overrideTypes<ListRow, { merge: false }>();
  return data ? toUserList(data) : null;
}

// The lists in the 2 promoted spots right now, lane 1 first.
// Cached for minutes, not hours, so a spot changes over soon after a promotion ends
export async function getPromotedLists(): Promise<PromotedList[]> {
  "use cache";
  cacheTag(USER_LISTS_TAG);
  cacheLife("minutes");

  const now = new Date().toISOString();
  const supabase = publicClient();
  const { data: promotions } = await supabase
    .from("list_promotions")
    .select("list_id, lane, ends_at")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .order("lane");
  if (!promotions?.length) return [];

  const { data: rows } = await supabase
    .from("user_lists")
    .select(LIST_SELECT)
    .eq("status", "published")
    .in(
      "id",
      promotions.map((p) => p.list_id),
    )
    .overrideTypes<ListRow[], { merge: false }>();
  const lists = new Map((rows ?? []).map((row) => [row.id, toUserList(row)]));

  // Hidden lists drop out, their row comes back empty
  return promotions.flatMap((p) => {
    const list = lists.get(p.list_id);
    return list ? [{ ...list, promotedUntil: p.ends_at }] : [];
  });
}

// One published list, for its own page
export async function getList(id: number): Promise<(UserList & { promotedUntil?: string }) | null> {
  "use cache";
  cacheTag(USER_LISTS_TAG);
  // Minutes, so the "Promoted until" label goes away soon after it ends
  cacheLife("minutes");

  const supabase = publicClient();
  const { data } = await supabase
    .from("user_lists")
    .select(LIST_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle()
    .overrideTypes<ListRow, { merge: false }>();
  if (!data) return null;

  const now = new Date().toISOString();
  const { data: promotion } = await supabase
    .from("list_promotions")
    .select("ends_at")
    .eq("list_id", id)
    .lte("starts_at", now)
    .gt("ends_at", now)
    .maybeSingle();

  return { ...toUserList(data), promotedUntil: promotion?.ends_at };
}
