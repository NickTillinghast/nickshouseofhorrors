"use server";

import { getHorrorMovies } from "@lib/tmdb";

const REEL_SIZE = 10;
// Deep pages are mostly obscure titles, keep the reel to recognizable movies
const MAX_PAGE = 25;
// Small subgenres (Splatter, J-Horror) have only a handful of movies with 200+ votes,
// so for those the reel accepts movies with fewer votes rather than coming up empty
const SMALL_SUBGENRE_MIN_VOTES = 50;

// A fresh random set of movies for the reel, optionally from one subgenre
export async function getReelMovies(subgenreId?: number) {
  let first = await getHorrorMovies(1, subgenreId);
  let minVotes: number | undefined;
  if (subgenreId && first.totalResults < REEL_SIZE) {
    minVotes = SMALL_SUBGENRE_MIN_VOTES;
    first = await getHorrorMovies(1, subgenreId, minVotes);
  }

  const page = 1 + Math.floor(Math.random() * Math.min(first.totalPages, MAX_PAGE));
  const { movies } = page === 1 ? first : await getHorrorMovies(page, subgenreId, minVotes);

  // Fisher–Yates shuffle, then take the first few
  const shuffled = movies.filter((movie) => movie.poster_path);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, REEL_SIZE);
}
