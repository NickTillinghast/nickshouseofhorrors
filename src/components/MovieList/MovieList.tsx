import Image from "next/image";
import Link from "next/link";
import type { MovieResult } from "moviedb-promise";
import styles from "./MovieList.module.css";

// Only what a row shows, so search results, discover results and full movie details all fit
type ListMovie = Pick<
  MovieResult,
  "id" | "title" | "poster_path" | "release_date" | "vote_average"
>;

type MovieListProps = {
  title: string;
  description?: string;
  movies: ListMovie[];
  // Red edge on the bottom as well as the top
  redBottom?: boolean;
  // Shown in place of the rows while the list has no movies
  emptyText?: string;
};

// A ranked list in a fixed-height box that scrolls, e.g. a top 50
export default function MovieList({
  title,
  description,
  movies,
  redBottom = false,
  emptyText = "No movies yet.",
}: MovieListProps) {
  return (
    <section
      className={`${styles.listBox} ${redBottom ? styles.redBottom : ""}`}
      aria-label={title}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>

      {movies.length === 0 && <p className={styles.empty}>{emptyText}</p>}

      {/* tabIndex lets keyboard users scroll the box with the arrow keys */}
      <ol className={styles.scroller} tabIndex={0} hidden={movies.length === 0}>
        {movies.map((movie, i) => (
          <li key={movie.id}>
            <Link href={`/movies/${movie.id}`} className={styles.row}>
              <span className={styles.rank}>{i + 1}</span>
              {movie.poster_path ? (
                <Image
                  className={styles.thumb}
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt=""
                  width={40}
                  height={60}
                />
              ) : (
                <span className={styles.thumb} />
              )}
              <span className={styles.info}>
                <span className={styles.movieTitle}>{movie.title}</span>
                <span className={styles.meta}>
                  {movie.release_date?.slice(0, 4)}
                  {movie.vote_average ? ` · ★ ${movie.vote_average.toFixed(1)}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
