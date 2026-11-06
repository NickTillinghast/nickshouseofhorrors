"use server";

import { refresh } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import type { FavoriteMovie } from "../../../lib/favorites";

// Server Actions can be called with anything, so check the shape before it reaches the database
function isValidMovie(movie: FavoriteMovie) {
  return (
    Number.isInteger(movie?.id) &&
    movie.id > 0 &&
    typeof movie.title === "string" &&
    movie.title.length > 0 &&
    movie.title.length <= 500
  );
}

async function getSignedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Not signed in");
  return { supabase, userId };
}

export async function addFavorite(movie: FavoriteMovie) {
  if (!isValidMovie(movie)) throw new Error("Invalid movie");
  const { supabase, userId } = await getSignedInClient();

  const { error } = await supabase.from("favorites").upsert(
    {
      user_id: userId,
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path ?? null,
      release_date: movie.release_date ?? null,
      overview: movie.overview?.slice(0, 5000) ?? null,
      vote_average: typeof movie.vote_average === "number" ? movie.vote_average : null,
    },
    // Hearting twice is a no-op, not an error
    { onConflict: "user_id,tmdb_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);

  // Re-render the page they're on, so the profile grid stays in sync
  refresh();
}

export async function removeFavorite(tmdbId: number) {
  if (!Number.isInteger(tmdbId)) throw new Error("Invalid movie");
  const { supabase, userId } = await getSignedInClient();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId);
  if (error) throw new Error(error.message);

  refresh();
}
