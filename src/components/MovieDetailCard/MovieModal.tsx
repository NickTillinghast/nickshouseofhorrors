"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { MovieResponse } from "moviedb-promise";
import MovieDetailCard from "./MovieDetailCard";
import useWatchSources from "@hooks/useWatchSources";
import styles from "./MovieModal.module.css";

type OpenOptions = {
  // Also look up where to watch as the modal opens
  whereToWatch?: boolean;
  // Scroll straight to the comments
  comments?: boolean;
};

// Lets anything on the card (poster, title, More, How to watch) open the same modal
const OpenModalContext = createContext<((options?: OpenOptions) => void) | null>(null);

type MovieModalProps = {
  movie: MovieResponse;
  children: ReactNode;
};

export default function MovieModal({ movie, children }: MovieModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState<MovieResponse | null>(null);
  const watch = useWatchSources(movie.id);
  // Comments only load once the modal has been opened, not for every card in the grid
  const [opened, setOpened] = useState(false);
  const [scrollToComments, setScrollToComments] = useState(0);
  const commentsId = `comments-${movie.id}`;

  useEffect(() => {
    if (scrollToComments) document.getElementById(commentsId)?.scrollIntoView({ block: "start" });
  }, [scrollToComments, commentsId]);

  async function open({
    whereToWatch: loadWhereToWatch = false,
    comments = false,
  }: OpenOptions = {}) {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    setOpened(true);

    if (loadWhereToWatch) watch.load();
    if (comments) setScrollToComments((n) => n + 1);

    if (!details) {
      const res = await fetch(`/api/movies?type=details&id=${movie.id}`);
      if (res.ok) setDetails(await res.json());
    }
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <OpenModalContext value={open}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        // Clicking the dark backdrop closes the modal
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          ✕
        </button>

        {/* Show what we already have until the full details load */}
        <MovieDetailCard
          movie={details ?? movie}
          full
          whereToWatch={watch}
          showComments={opened}
          commentsId={commentsId}
        />
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
