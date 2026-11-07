import Image from "next/image";
import type { MovieResponse } from "moviedb-promise";
import MovieModal, { MovieModalTrigger } from "./MovieModal";
import FavoriteButton from "./FavoriteButton";
import CommentBubble from "../Comments/CommentBubble";
import CommentSection from "../Comments/CommentSection";
import { movieThread } from "../../lib/comments";
import WhereToWatch from "./WhereToWatch";
import type { WatchState } from "../../hooks/useWatchSources";
import styles from "./MovieDetailCard.module.css";
import modalStyles from "./MovieModal.module.css";
import watchStyles from "./WhereToWatch.module.css";

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
  // Where-to-watch state from the modal, so it can load before the modal opens
  whereToWatch?: WatchState;
  // Top rated movies get a red border to stand out in the grid
  featured?: boolean;
  // Show the comment section (full cards only)
  showComments?: boolean;
  commentsId?: string;
};

export default function MovieDetailCard({
  movie,
  full = false,
  whereToWatch,
  featured = false,
  showComments = false,
  commentsId,
}: MovieDetailCardProps) {
  const year = movie.release_date?.slice(0, 4);
  const isTruncated = !full && (movie.overview?.length ?? 0) > OVERVIEW_MAX_LENGTH;

  const poster = movie.poster_path && (
    <Image
      className={styles.poster}
      src={`${POSTER_BASE_URL}${movie.poster_path}`}
      alt={`${movie.title} poster`}
      width={300}
      height={450}
    />
  );

  const card = (
    <article
      className={`${styles.card} ${full ? styles.cardFull : ""} ${featured ? styles.featured : ""}`}
    >
      {featured && <span className={styles.badge}>Top rated</span>}
      {full
        ? poster
        : poster && (
            <MovieModalTrigger
              className={styles.posterButton}
              aria-label={`Open details for ${movie.title}`}
            >
              {poster}
            </MovieModalTrigger>
          )}
      <div className={styles.info}>
        <div className={`${styles.titleContainer} ${full ? styles.titleContainerFull : ""}`}>
          <div>
            <h2 className={styles.title}>
              {full ? (
                movie.title
              ) : (
                <MovieModalTrigger className={styles.titleButton}>{movie.title}</MovieModalTrigger>
              )}{" "}
              {year && <span className={styles.year}>({year})</span>}
            </h2>
          </div>
          <div className={styles.cardActions}>
            {movie.id !== undefined && (
              <CommentBubble
                thread={movieThread(movie.id)}
                title={movie.title}
                scrollTo={full ? commentsId : undefined}
              />
            )}
            <FavoriteButton movie={movie} />
          </div>
        </div>
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
          <p className={styles.overview}>
            {isTruncated ? truncate(movie.overview, OVERVIEW_MAX_LENGTH) : movie.overview}
            {isTruncated && (
              <MovieModalTrigger className={modalStyles.more}>More</MovieModalTrigger>
            )}
          </p>
        )}

        {/* The grid only gets a button, the list of services lives in the modal */}
        <div className={styles.watch}>
          {full ? (
            whereToWatch && <WhereToWatch {...whereToWatch} />
          ) : (
            <MovieModalTrigger className={watchStyles.button} whereToWatch>
              How to watch
            </MovieModalTrigger>
          )}
        </div>

        {/* {full && showComments && movie.id !== undefined && (
          <CommentSection thread={movieThread(movie.id)} id={commentsId} />
        )} */}
      </div>
    </article>
  );

  return full ? card : <MovieModal movie={movie}>{card}</MovieModal>;
}
