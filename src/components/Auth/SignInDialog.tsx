"use client";

import type { Ref } from "react";
import SignInForm from "./SignInForm";
import modalStyles from "../MovieDetailCard/MovieModal.module.css";
import styles from "./SignInDialog.module.css";

type SignInDialogProps = {
  ref: Ref<HTMLDialogElement>;
  next: string;
};

// Shown when someone logged out clicks a heart
export default function SignInDialog({ ref, next }: SignInDialogProps) {
  function close(dialog: HTMLDialogElement | null) {
    dialog?.close();
  }

  return (
    <dialog
      ref={ref}
      className={`${modalStyles.dialog} ${styles.dialog}`}
      // Clicking the dark backdrop closes it
      onClick={(e) => e.target === e.currentTarget && close(e.currentTarget)}
    >
      <button
        type="button"
        className={modalStyles.close}
        onClick={(e) => close(e.currentTarget.closest("dialog"))}
        aria-label="Close"
      >
        ✕
      </button>

      <div className={styles.content}>
        <h2 className={styles.title}>Sign in to save favorites</h2>
        <p className={styles.text}>
          Hearted movies are saved to your profile so you can find them later.
        </p>
        <SignInForm next={next} />
      </div>
    </dialog>
  );
}
