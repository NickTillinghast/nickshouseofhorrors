"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MovieModal, { MovieModalTrigger } from "../MovieDetailCard/MovieModal";
import { SEARCH_MIN_CHARS as MIN_CHARS, useMovieSearch } from "../../hooks/useMovieSearch";
import styles from "./SearchBox.module.css";

export default function SearchBox() {
  const router = useRouter();
  const { query, trimmed, results, loading, changeQuery } = useMovieSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click anywhere else closes the dropdown. The movie modal lives inside it, so clicks there don't count
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Press "/" anywhere to jump to the search box
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable], dialog");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function onChange(value: string) {
    changeQuery(value);
    setOpen(true);
  }

  function submit() {
    if (trimmed.length < MIN_CHARS) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  // Arrow keys move between the input and the results
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = [
      inputRef.current,
      ...(containerRef.current?.querySelectorAll<HTMLElement>("[data-result]") ?? []),
    ].filter((el): el is HTMLElement => el !== null);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    e.preventDefault();
    const next = e.key === "ArrowDown" ? index + 1 : index - 1;
    items[(next + items.length) % items.length].focus();
  }

  const showDropdown = open && trimmed.length >= MIN_CHARS && (loading || results !== null);

  return (
    <div ref={containerRef} className={styles.container} onKeyDown={onKeyDown}>
      <form
        role="search"
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search horror…"
          aria-label="Search horror movies"
          aria-keyshortcuts="/"
          enterKeyHint="search"
        />
        <kbd className={styles.shortcut} aria-hidden="true">
          /
        </kbd>
      </form>

      {/* Announces the result count to screen readers */}
      <p className={styles.srOnly} aria-live="polite">
        {showDropdown && !loading && results ? `${results.length} results` : ""}
      </p>

      {showDropdown && (
        <div className={styles.dropdown}>
          {loading && !results && <p className={styles.status}>Searching the crypt…</p>}

          {results && results.length === 0 && !loading && (
            <p className={styles.status}>No horror movies match “{trimmed}”.</p>
          )}

          {results && results.length > 0 && (
            <ul className={`${styles.results} ${loading ? styles.stale : ""}`}>
              {results.map((movie) => (
                <li key={movie.id}>
                  {/* Same modal as the movie cards; a modifier-click still opens the movie page */}
                  <MovieModal movie={movie}>
                    <MovieModalTrigger
                      href={`/movies/${movie.id}`}
                      className={styles.result}
                      data-result
                    >
                      {movie.poster_path ? (
                        <Image
                          className={styles.poster}
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt=""
                          width={32}
                          height={48}
                        />
                      ) : (
                        <span className={styles.poster} aria-hidden="true" />
                      )}
                      <span className={styles.resultTitle}>{movie.title}</span>
                      <span className={styles.year}>{movie.release_date?.slice(0, 4)}</span>
                    </MovieModalTrigger>
                  </MovieModal>
                </li>
              ))}
            </ul>
          )}

          {results && results.length > 0 && (
            <button type="button" className={styles.seeAll} onClick={submit} data-result>
              See all results for “{trimmed}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
