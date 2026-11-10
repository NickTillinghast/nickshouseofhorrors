"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { MovieResponse } from "moviedb-promise";
import MovieDetailCard from "./MovieDetailCard";
import CommentsPanel from "@components/Comments/CommentsPanel";
import useWatchSources from "@hooks/useWatchSources";
import styles from "./MovieModal.module.css";

type OpenOptions = {
  // Also look up where to watch as the modal opens
  whereToWatch?: boolean;
  // Open on the comments instead of the details
  comments?: boolean;
};

// Lets anything on the card (poster, title, More, How to watch, comment bubble) open the same modal
const OpenModalContext = createContext<((options?: OpenOptions) => void) | null>(null);

// True inside a MovieModal, false on a plain page like /movies/[id]
export function useInMovieModal() {
  return useContext(OpenModalContext) !== null;
}

type MovieModalProps = {
  movie: MovieResponse;
  children: ReactNode;
};

// One modal, two views: the movie's details and its comments. Switching swaps the content
// instead of stacking a second modal, so Escape, focus and the back button stay simple
export default function MovieModal({ movie, children }: MovieModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState<MovieResponse | null>(null);
  const watch = useWatchSources(movie.id);
  const [view, setView] = useState<"details" | "comments">("details");
  // Comments load the first time someone looks at them, not for every card in the grid.
  // After that they stay mounted, so a half-typed comment survives a trip to the details
  const [commentsOpened, setCommentsOpened] = useState(false);

  function showComments() {
    setView("comments");
    setCommentsOpened(true);
    // Move focus into the new view, for keyboard and screen reader users
    requestAnimationFrame(() => backRef.current?.focus());
  }

  async function open({
    whereToWatch: loadWhereToWatch = false,
    comments = false,
  }: OpenOptions = {}) {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();

    if (comments) showComments();
    else setView("details");
    if (loadWhereToWatch) watch.load();

    if (!details) {
      const res = await fetch(`/api/movies?type=details&id=${movie.id}`);
      if (res.ok) setDetails(await res.json());
    }
  }

  function close() {
    dialogRef.current?.close();
  }

  const shown = details ?? movie;

  return (
    <OpenModalContext value={open}>
      {children}
      <dialog
        ref={dialogRef}
        className={`${styles.dialog} ${view === "comments" ? styles.dialogComments : ""}`}
        aria-label={view === "comments" ? `Comments on ${shown.title}` : shown.title}
        // Clicking the dark backdrop closes the modal
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          ✕
        </button>

        <div className={styles.view} hidden={view !== "details"}>
          {/* Show what we already have until the full details load */}
          <MovieDetailCard movie={shown} full whereToWatch={watch} />
        </div>

        {commentsOpened && shown.id !== undefined && (
          <div className={`${styles.view} ${styles.commentsView}`} hidden={view !== "comments"}>
            <CommentsPanel
              movieId={shown.id}
              title={shown.title ?? "this movie"}
              year={shown.release_date?.slice(0, 4)}
              posterPath={shown.poster_path}
              onBack={() => setView("details")}
              backRef={backRef}
            />
          </div>
        )}
      </dialog>
    </OpenModalContext>
  );
}

type MovieModalTriggerProps = {
  children: ReactNode;
  className?: string;
  whereToWatch?: boolean;
  comments?: boolean;
  // Render a real link to the movie's page, so search engines can follow it
  href?: string;
  "aria-label"?: string;
};

// A button (or link) that opens the nearest MovieModal
export function MovieModalTrigger({
  children,
  whereToWatch = false,
  comments = false,
  href,
  ...props
}: MovieModalTriggerProps) {
  const open = useContext(OpenModalContext);

  if (href) {
    return (
      <Link
        href={href}
        // Dozens of cards per page, don't preload every movie page
        prefetch={false}
        onClick={(e) => {
          // Cmd/Ctrl/Shift/middle click keep normal link behaviour (new tab, etc.)
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          open?.({ whereToWatch, comments });
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => open?.({ whereToWatch, comments })} {...props}>
      {children}
    </button>
  );
}
