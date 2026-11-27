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

// The newest published pick with its movie from TMDB, or null when there's none yet.
// Refreshes on its own every few minutes, so a new pick shows up without a deploy
export async function getNicksPick(): Promise<NicksPick | null> {
  "use cache";
  cacheTag(NICKS_PICK_TAG);
  cacheLife("minutes");

  const { data, error } = await publicClient()
    .from("nicks_picks")
    .select("tmdb_id, heading, note")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle<PickRow>();
  // Shows up in CloudWatch, so a broken query doesn't just look like "no pick"
  if (error) console.error("Couldn't load Nick's pick:", error.message);
  if (!data) return null;

  // A mistyped id (TMDB answers 404) hides the section instead of breaking the home page
  const movie = await getMovie(String(data.tmdb_id)).catch(() => null);
  if (!movie) {
    console.error(`Nick's pick: TMDB has no movie ${data.tmdb_id}`);
    return null;
  }
  return { heading: data.heading.trim(), note: data.note?.trim() || null, movie };
}
