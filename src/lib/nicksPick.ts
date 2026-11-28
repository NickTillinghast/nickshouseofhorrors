import { createClient } from "@supabase/supabase-js";
import type { MovieResponse } from "moviedb-promise";
import { cacheLife, cacheTag } from "next/cache";
import { getMovie } from "./tmdb";

// Nick's pick on the home page. Added in the Supabase dashboard, see docs/nicks-pick.md

export const NICKS_PICK_TAG = "nicks-pick";

export type NicksPick = {
  heading: string;
  note: string | null;
  movie: MovieResponse;
};

type PickRow = { tmdb_id: number; heading: string; note: string | null };

// Public reads (Row Level Security only shows published picks), no login cookie needed
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// How many picks the home page shows, newest first
export const NICKS_PICKS_SHOWN = 2;

// The newest published picks with their movies from TMDB, or [] when there are none yet.
// Refreshes on its own every few minutes, so a new pick shows up without a deploy
export async function getNicksPicks(): Promise<NicksPick[]> {
  "use cache";
  cacheTag(NICKS_PICK_TAG);
  cacheLife("minutes");

  const { data, error } = await publicClient()
    .from("nicks_picks")
    .select("tmdb_id, heading, note")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(NICKS_PICKS_SHOWN)
    .overrideTypes<PickRow[], { merge: false }>();
  // Shows up in CloudWatch, so a broken query doesn't just look like "no picks"
  if (error) console.error("Couldn't load Nick's picks:", error.message);

  const picks = await Promise.all(
    (data ?? []).map(async (row) => {
      // A mistyped id (TMDB answers 404) skips that pick instead of breaking the home page
      const movie = await getMovie(String(row.tmdb_id)).catch(() => null);
      if (!movie) {
        console.error(`Nick's pick: TMDB has no movie ${row.tmdb_id}`);
        return null;
      }
      return { heading: row.heading.trim(), note: row.note?.trim() || null, movie };
    }),
  );
  return picks.filter((pick) => pick !== null);
}
