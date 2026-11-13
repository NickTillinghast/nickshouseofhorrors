"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MovieResult } from "moviedb-promise";
import MovieModal, { MovieModalTrigger } from "@components/MovieDetailCard/MovieModal";
import { getReelMovies } from "@app/(pages)/home/actions";
import GenreSelect from "@components/GenreSelect/GenreSelect";
import watchStyles from "@components/MovieDetailCard/WhereToWatch.module.css";
import styles from "./HorrorReel.module.css";

// Speeds are in cards per second
const DRIFT_SPEED = 0.35;
const SPIN_MS = 4500;
const SPIN_LAPS = 3;
// Max horizontal motion blur in px, reached at full spin speed
const MAX_BLUR = 6;

// Fast start, long slow finish, like a train braking into the station
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

// Where card i sits relative to the center slot, wrapped so the strip loops (-n/2 to n/2)
function offsetFromCenter(i: number, position: number, count: number) {
  const d = (((i - position) % count) + count) % count;
  return d > count / 2 ? d - count : d;
}

// Center card is full size and bright, neighbors shrink and dim
function cardStyle(d: number) {
  const distance = Math.min(Math.abs(d), 1);
  return {
    "--d": d,
    "--scale": 1 - 0.22 * distance,
    "--opacity": 1 - 0.55 * distance,
    zIndex: 10 - Math.round(Math.abs(d)),
    visibility: Math.abs(d) > 2.5 ? "hidden" : "visible",
  } as React.CSSProperties;
}

type HorrorReelProps = {
  initialMovies: MovieResult[];
};

export default function HorrorReel({ initialMovies }: HorrorReelProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [genreId, setGenreId] = useState<number | undefined>();
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<MovieResult | null>(null);
  // Why the reel didn't change, e.g. a genre with too few movies
  const [notice, setNotice] = useState<string>();
  // Each load gets a number; an answer for anything but the latest one is ignored
  const latestLoad = useRef(0);

  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  // Animation state lives in refs so the strip can move 60 times a second without re-rendering React
  const positionRef = useRef(0);
  const hoveringRef = useRef(false);
  const spinRef = useRef<{
    start: number;
    end: number;
    startTime: number;
    winnerIndex: number;
  } | null>(null);
  const stoppedRef = useRef(false);

  // One animation loop for both the slow drift and the spin
  useEffect(() => {
    const count = movies.length;
    if (count === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastTime = performance.now();
    let frameId = 0;

    function place(position: number, speed: number) {
      positionRef.current = position;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const style = cardStyle(offsetFromCenter(i, position, count));
        for (const [key, value] of Object.entries(style)) {
          if (key.startsWith("--")) card.style.setProperty(key, String(value));
          else card.style[key as "zIndex" | "visibility"] = String(value);
        }
      });
      // Blur sideways only, scaled to how fast the strip is moving
      const blur = Math.min(speed / 25, 1) * MAX_BLUR;
      blurRef.current?.setAttribute("stdDeviation", `${blur.toFixed(2)} 0`);
    }

    function frame(now: number) {
      // Clamp so coming back to a background tab doesn't jump the strip
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const spin = spinRef.current;
      if (spin) {
        const progress = Math.min((now - spin.startTime) / SPIN_MS, 1);
        const position = spin.start + (spin.end - spin.start) * easeOutQuart(progress);
        // Speed is the derivative of the easing curve, in cards per second
        const speed = ((spin.end - spin.start) * 4 * Math.pow(1 - progress, 3)) / (SPIN_MS / 1000);
        place(position, speed);

        if (progress >= 1) {
          spinRef.current = null;
          stoppedRef.current = true;
          setSpinning(false);
          setWinner(movies[spin.winnerIndex]);
        }
      } else if (!reducedMotion && !hoveringRef.current && !stoppedRef.current) {
        place(positionRef.current + DRIFT_SPEED * dt, DRIFT_SPEED);
      }

      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [movies]);

  function spin() {
    const count = movies.length;
    if (spinning || count < 2) return;

    const winnerIndex = Math.floor(Math.random() * count);
    const start = positionRef.current;
    // A few full laps, then the first position where the winner sits dead center
    let end = Math.ceil(start + SPIN_LAPS * count);
    end += (((winnerIndex - end) % count) + count) % count;

    setWinner(null);
    stoppedRef.current = false;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Jump straight to the pick
      spinRef.current = { start: end, end, startTime: 0, winnerIndex };
    } else {
      spinRef.current = { start, end, startTime: performance.now(), winnerIndex };
    }
    setSpinning(true);
  }

  // Loads a new set of movies. Returns false (and leaves the reel as it was) when it can't
  async function refill(nextGenreId = genreId) {
    const loadId = ++latestLoad.current;
    setLoading(true);
    setWinner(null);
    setNotice(undefined);
    try {
      const next = await getReelMovies(nextGenreId);
      if (loadId !== latestLoad.current) return false;
      if (next.length < 2) {
        setNotice("Not enough movies in that genre for the reel yet. Try another one.");
        return false;
      }
      positionRef.current = 0;
      stoppedRef.current = false;
      setMovies(next);
      return true;
    } catch {
      if (loadId === latestLoad.current) setNotice("Couldn't load movies, try again.");
      return false;
    } finally {
      if (loadId === latestLoad.current) setLoading(false);
    }
  }

  // The dropdown only switches once the new movies are actually on the reel
  async function changeGenre(id: number | undefined) {
    const previous = genreId;
    setGenreId(id);
    if (!(await refill(id))) setGenreId(previous);
  }

  const busy = spinning || loading;

  return (
    <div className={styles.reelArea}>
      <div className={styles.controls}>
        <GenreSelect label="Genre" value={genreId} onChange={changeGenre} disabled={busy} />
        <button
          type="button"
          className={watchStyles.button}
          onClick={() => refill()}
          disabled={busy}
        >
          {loading ? "Loading…" : "New movies"}
        </button>
      </div>

      <p className={styles.notice} aria-live="polite">
        {notice}
      </p>

      {/* Horizontal-only blur for the cards while the strip is moving fast */}
      <svg className={styles.srOnly} aria-hidden="true">
        <filter id="reel-motion-blur">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
        </filter>
      </svg>

      <div className={styles.frame}>
        <div
          className={styles.viewport}
          // Pause the drift while someone is looking at a card
          onPointerEnter={() => (hoveringRef.current = true)}
          onPointerLeave={() => (hoveringRef.current = false)}
          onFocus={() => (hoveringRef.current = true)}
          onBlur={() => (hoveringRef.current = false)}
        >
          <ul className={styles.track} aria-label="Reel of horror movies">
            {movies.map((movie, i) => (
              <li
                key={movie.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={styles.card}
                style={cardStyle(offsetFromCenter(i, 0, movies.length))}
              >
                {movie.poster_path ? (
                  <Image
                    className={styles.poster}
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt=""
                    width={342}
                    height={513}
                    draggable={false}
                  />
                ) : (
                  <div className={styles.poster} />
                )}
                <p className={styles.cardTitle}>{movie.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        className={styles.spin}
        onClick={spin}
        disabled={busy || movies.length < 2}
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>

      {/* Screen readers hear the result when the reel stops */}
      <p className={styles.srOnly} aria-live="polite">
        {winner ? `The reel picked ${winner.title}` : ""}
      </p>

      {winner && (
        <MovieModal key={winner.id} movie={winner}>
          <div className={styles.result}>
            {winner.poster_path && (
              <Image
                className={styles.resultPoster}
                src={`https://image.tmdb.org/t/p/w185${winner.poster_path}`}
                alt=""
                width={80}
                height={120}
              />
            )}
            <div className={styles.resultInfo}>
              <p className={styles.resultLabel}>Tonight you&apos;re watching</p>
              <p className={styles.resultTitle}>
                {winner.title}{" "}
                {winner.release_date && (
                  <span className={styles.resultYear}>({winner.release_date.slice(0, 4)})</span>
                )}
              </p>
              <div className={styles.resultActions}>
                <MovieModalTrigger className={watchStyles.button}>See details</MovieModalTrigger>
                <MovieModalTrigger className={watchStyles.button} whereToWatch>
                  How to watch
                </MovieModalTrigger>
              </div>
            </div>
          </div>
        </MovieModal>
      )}
    </div>
  );
}
