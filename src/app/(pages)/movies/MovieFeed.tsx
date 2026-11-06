"use client";

import { useState } from "react";
import type { MovieResult } from "moviedb-promise";
import MovieDetailCard from "../../../components/MovieDetailCard/MovieDetailCard";
import { loadHorrorMovies } from "./actions";
import styles from "./page.module.css";

type MovieFeedProps = {
  // Shown first with a red border, and left out of the rest of the feed
  topRated: MovieResult[];
  initialMovies: MovieResult[];
  // The next TMDB page to ask for, works like a "next token"
  nextPage: number;
  totalPages: number;
  subgenreId?: number;
};

// Drop movies already on screen, in case TMDB's results shift between pages
function withoutDuplicates(movies: MovieResult[], shown: MovieResult[]) {
  const seen = new Set(shown.map((movie) => movie.id));
  return movies.filter((movie) => !seen.has(movie.id));
}

export default function MovieFeed({
  topRated,
  initialMovies,
  nextPage,
  totalPages,
  subgenreId,
}: MovieFeedProps) {
  const [movies, setMovies] = useState(() => withoutDuplicates(initialMovies, topRated));
  const [page, setPage] = useState(nextPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setError(false);

    try {
      const res = await loadHorrorMovies(page, subgenreId);
      setMovies((current) => [
        ...current,
        ...withoutDuplicates(res.movies, [...topRated, ...current]),
      ]);
      setPage(page + 1);
    } catch {
      setError(true);
    }

    setLoading(false);
  }

  if (topRated.length === 0 && movies.length === 0) {
    return <p className={styles.error}>No movies found for this subgenre.</p>;
  }

  return (
    <>
      <div className={styles.grid}>
        {topRated.map((movie) => (
          <MovieDetailCard key={movie.id} movie={movie} featured />
        ))}
        {movies.map((movie) => (
          <MovieDetailCard key={movie.id} movie={movie} />
        ))}
      </div>

      {page <= totalPages && (
        <div className={styles.loadMoreContainer}>
          <button type="button" className={styles.loadMore} onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </button>
          {error && <p className={styles.error}>Couldn&apos;t load more movies. Try again.</p>}
        </div>
      )}
    </>
  );
}
