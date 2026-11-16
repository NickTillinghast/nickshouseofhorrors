"use client";

import { useEffect, useRef, useState } from "react";
import CommentSection from "@components/Comments/CommentSection";
import styles from "./Battle.module.css";

// A fixed-height comments box that only loads once it's about to scroll into view,
// so a long page of battles doesn't fetch every thread at once
export default function LazyComments({ thread, label }: { thread: string; label: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={styles.comments}>
      <p className={styles.commentsLabel}>{label}</p>
      {visible ? (
        <CommentSection thread={thread} variant="panel" />
      ) : (
        <p className={styles.commentsLoading}>Loading comments…</p>
      )}
    </div>
  );
}
