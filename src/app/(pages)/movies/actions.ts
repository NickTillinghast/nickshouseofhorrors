"use server";

import { getHorrorMovies } from "@lib/tmdb";

// Called by the Load more button, keeps the TMDB key on the server
export async function loadHorrorMovies(page: number, subgenreId?: number) {
  return getHorrorMovies(page, subgenreId);
}
