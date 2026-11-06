import type { MovieResult } from "moviedb-promise";

// The card details we copy into the favorites table (see supabase/migrations/001_favorites.sql)
export type FavoriteMovie = {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
  vote_average?: number;
};

// Any TMDB movie shape (search result or full details) that has these fields
export type FavoriteSource = Pick<
  MovieResult,
  "id" | "title" | "poster_path" | "release_date" | "overview" | "vote_average"
>;

// Keep only what the table stores, TMDB movies carry a lot more
export function toFavoriteMovie(movie: FavoriteSource): FavoriteMovie | null {
  if (movie.id === undefined || !movie.title) return null;

  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    overview: movie.overview,
    vote_average: movie.vote_average,
  };
}
