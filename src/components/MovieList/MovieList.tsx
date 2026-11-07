import Image from "next/image";
import Link from "next/link";
import type { MovieResult } from "moviedb-promise";
import styles from "./MovieList.module.css";

type MovieListProps = {
  title: string;
  description?: string;
  movies: MovieResult[];
};

// A ranked list in a fixed-height box that scrolls, e.g. a top 50
export default function MovieList({ title, description, movies }: MovieListProps) {
  return (
    <section className={styles.listBox} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>

      {/* tabIndex lets keyboard users scroll the box with the arrow keys */}
      <ol className={styles.scroller} tabIndex={0}>
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
