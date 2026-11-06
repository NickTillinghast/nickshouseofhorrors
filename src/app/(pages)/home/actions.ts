"use server";

import { getHorrorMovies } from "../../../lib/tmdb";

const REEL_SIZE = 10;
// Deep pages are mostly obscure titles, keep the reel to recognizable movies
const MAX_PAGE = 25;

// A fresh random set of movies for the reel, optionally from one subgenre
export async function getReelMovies(subgenreId?: number) {
  const { totalPages } = await getHorrorMovies(1, subgenreId);
  const page = 1 + Math.floor(Math.random() * Math.min(totalPages, MAX_PAGE));
  const { movies } = await getHorrorMovies(page, subgenreId);

  // Fisher–Yates shuffle, then take the first few
  const shuffled = movies.filter((movie) => movie.poster_path);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, REEL_SIZE);
}
