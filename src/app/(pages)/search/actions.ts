"use server";

import { searchHorrorMovies } from "../../../lib/tmdb";

// A "use server" file can only export async functions, so these stay private
const SEARCH_MIN_CHARS = 4;
const DROPDOWN_LIMIT = 8;

// Quick results for the navbar dropdown. Runs on the server so the TMDB key never reaches the browser
export async function quickSearch(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < SEARCH_MIN_CHARS || q.length > 100) return [];

  const movies = await searchHorrorMovies(q);
  // Only send what the dropdown and modal need
  return movies.slice(0, DROPDOWN_LIMIT).map((movie) => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    overview: movie.overview,
    vote_average: movie.vote_average,
  }));
}
