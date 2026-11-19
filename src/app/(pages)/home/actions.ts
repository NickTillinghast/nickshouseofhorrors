"use server";

import { getHorrorMovies } from "@lib/tmdb";

const REEL_SIZE = 10;
// TMDB always returns 20 movies per page
const PAGE_SIZE = 20;
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

  // Only full pages: the last page can hold a single movie (Zombie has 161 = 8 pages of 20 + 1),
  // which would leave the reel empty
  const fullPages = Math.max(1, Math.floor(first.totalResults / PAGE_SIZE));
  const page = 1 + Math.floor(Math.random() * Math.min(fullPages, MAX_PAGE));
  let { movies } = page === 1 ? first : await getHorrorMovies(page, subgenreId, minVotes);
  // Still short (movies without posters are skipped)? Top up from the first page
  if (page !== 1 && movies.filter((movie) => movie.poster_path).length < REEL_SIZE) {
    const seen = new Set(movies.map((movie) => movie.id));
    movies = [...movies, ...first.movies.filter((movie) => !seen.has(movie.id))];
  }

  // Fisher–Yates shuffle, then take the first few
  const shuffled = movies.filter((movie) => movie.poster_path);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, REEL_SIZE);
}
