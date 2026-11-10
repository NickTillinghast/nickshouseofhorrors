"use client";

import type { RefObject } from "react";
import Image from "next/image";
import useCommentCount from "@hooks/useCommentCount";
import { movieThread } from "@lib/comments";
import CommentSection from "./CommentSection";
import styles from "./CommentsPanel.module.css";

type CommentsPanelProps = {
  movieId: number;
  title: string;
  year?: string;
  posterPath?: string | null;
  onBack: () => void;
  backRef?: RefObject<HTMLButtonElement | null>;
};

// The comments view of the movie modal: a small header, the comments scrolling in the middle,
// and the box to add one pinned at the bottom
export default function CommentsPanel({
  movieId,
  title,
  year,
  posterPath,
  onBack,
  backRef,
}: CommentsPanelProps) {
  const thread = movieThread(movieId);
  const count = useCommentCount(thread);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <button ref={backRef} type="button" className={styles.back} onClick={onBack}>
          <span aria-hidden="true">←</span> Details
        </button>
        <div className={styles.movie}>
          {posterPath ? (
            <Image
              className={styles.thumb}
              src={`https://image.tmdb.org/t/p/w92${posterPath}`}
              alt=""
              width={32}
              height={48}
            />
          ) : (
            <span className={styles.thumb} />
          )}
          <div className={styles.movieText}>
            <h2 className={styles.title}>
              {title} {year && <span className={styles.year}>({year})</span>}
            </h2>
            <p className={styles.count}>
              {count === undefined
                ? "Comments"
                : `${count} ${count === 1 ? "comment" : "comments"}`}
            </p>
          </div>
        </div>
      </header>

      <CommentSection thread={thread} variant="panel" />
    </div>
  );
}
