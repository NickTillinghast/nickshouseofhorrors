"use client";

import { useRef, useState } from "react";
import type { MovieResponse } from "moviedb-promise";
import MovieDetailCard from "./MovieDetailCard";
import styles from "./MovieModal.module.css";

type MovieDetailModalProps = {
  movie: MovieResponse;
};

export default function MovieModal({ movie }: MovieDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState<MovieResponse | null>(null);

  async function open() {
    dialogRef.current?.showModal();

    if (!details) {
      const res = await fetch(`/api/movies?type=details&id=${movie.id}`);
      if (res.ok) setDetails(await res.json());
    }
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button type="button" className={styles.more} onClick={open}>
        More
      </button>
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
        <MovieDetailCard movie={details ?? movie} full />
      </dialog>
    </>
  );
}
