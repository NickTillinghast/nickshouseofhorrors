"use client";

import type { MovieResponse } from "moviedb-promise";
import MovieDetailCard from "../../../../components/MovieDetailCard/MovieDetailCard";
import useWatchSources from "../../../../hooks/useWatchSources";

// Client wrapper so the page gets the same "How to watch" button as the modal
export default function MovieDetails({ movie }: { movie: MovieResponse }) {
  const whereToWatch = useWatchSources(movie.id);

  return (
    <MovieDetailCard
      movie={movie}
      full
      whereToWatch={whereToWatch}
      showComments
      commentsId={`comments-${movie.id}`}
    />
  );
}
