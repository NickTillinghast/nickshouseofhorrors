"use client";

import useCommentCount from "@hooks/useCommentCount";
import { MovieModalTrigger } from "@components/MovieDetailCard/MovieModal";
import styles from "./CommentBubble.module.css";

type CommentBubbleProps = {
  thread: string;
  title?: string;
  // On the movie's own page the comments are already below, scroll to this element instead
  scrollTo?: string;
};

// Speech bubble with the comment count. Opens the movie modal on its comments view
// (or switches to it when the modal is already open)
export default function CommentBubble({ thread, title, scrollTo }: CommentBubbleProps) {
  const count = useCommentCount(thread);
  const label =
    count === undefined ? "comments" : `${count} ${count === 1 ? "comment" : "comments"}`;
  const ariaLabel = `${scrollTo ? "Go to" : "Open"} ${label} for ${title ?? "this movie"}`;

  const content = (
    <>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.3 3.4A.5.5 0 0 1 4 20v-3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      </svg>
      <span className={styles.count}>{count ?? ""}</span>
    </>
  );

  if (scrollTo) {
    return (
      <button
        type="button"
        className={styles.bubble}
        aria-label={ariaLabel}
        onClick={() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" })}
      >
        {content}
      </button>
    );
  }

  return (
    <MovieModalTrigger className={styles.bubble} comments aria-label={ariaLabel}>
      {content}
    </MovieModalTrigger>
  );
}
