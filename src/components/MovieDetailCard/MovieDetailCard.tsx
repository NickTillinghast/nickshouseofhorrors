import Image from "next/image";
import type { MovieResponse } from "moviedb-promise";
import MovieModal from "./MovieModal";
import styles from "./MovieDetailCard.module.css";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const OVERVIEW_MAX_LENGTH = 200;

// Cut at the last full word before maxLength and add an ellipsis
function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:!?-]+$/, "") + "…";
}

type MovieDetailCardProps = {
  movie: MovieResponse;
  // Show the whole description (used inside the modal)
  full?: boolean;
};

export default function MovieDetailCard({ movie, full = false }: MovieDetailCardProps) {
  const year = movie.release_date?.slice(0, 4);
  const isTruncated = !full && (movie.overview?.length ?? 0) > OVERVIEW_MAX_LENGTH;

  return (
    <article className={styles.card}>
      {movie.poster_path && (
        <Image
          className={styles.poster}
          src={`${POSTER_BASE_URL}${movie.poster_path}`}
          alt={`${movie.title} poster`}
          width={300}
          height={450}
        />
      )}

      <div className={styles.info}>
        <h2 className={styles.title}>
          {movie.title} {year && <span className={styles.year}>({year})</span>}
        </h2>

        {movie.tagline && <p className={styles.tagline}>{movie.tagline}</p>}

        <ul className={styles.meta}>
          {movie.vote_average !== undefined && <li>★ {movie.vote_average.toFixed(1)}</li>}
          {movie.runtime ? <li>{movie.runtime} min</li> : null}
        </ul>

        {movie.genres && (
          <ul className={styles.genres}>
            {movie.genres.map((genre) => (
              <li key={genre.id}>{genre.name}</li>
            ))}
          </ul>
        )}

        {movie.overview && (
          // A <div>, not a <p>, because the modal inside can't live in a paragraph
          <div className={styles.overview}>
            {isTruncated ? truncate(movie.overview, OVERVIEW_MAX_LENGTH) : movie.overview}
            {isTruncated && <MovieModal movie={movie} />}
          </div>
        )}
      </div>
    </article>
  );
}
