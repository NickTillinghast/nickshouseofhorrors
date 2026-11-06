"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { MovieResponse } from "moviedb-promise";
import MovieDetailCard from "./MovieDetailCard";
import useWatchSources from "../../hooks/useWatchSources";
import styles from "./MovieModal.module.css";

type OpenOptions = {
  // Also look up where to watch as the modal opens
  whereToWatch?: boolean;
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

  async function open({ whereToWatch: loadWhereToWatch = false }: OpenOptions = {}) {
    dialogRef.current?.showModal();

    if (loadWhereToWatch) watch.load();

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
        <MovieDetailCard movie={details ?? movie} full whereToWatch={watch} />
      </dialog>
    </OpenModalContext>
  );
}

type MovieModalTriggerProps = {
  children: ReactNode;
  className?: string;
  whereToWatch?: boolean;
  "aria-label"?: string;
};

// A button that opens the nearest MovieModal
export function MovieModalTrigger({
  children,
  whereToWatch = false,
  ...props
}: MovieModalTriggerProps) {
  const open = useContext(OpenModalContext);

  return (
    <button type="button" onClick={() => open?.({ whereToWatch })} {...props}>
      {children}
    </button>
  );
}
