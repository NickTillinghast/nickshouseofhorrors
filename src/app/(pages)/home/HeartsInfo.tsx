"use client";

import { useRef } from "react";
import Image from "next/image";
import HeartsCta from "./HeartsCta";
import { MY_MOVIES_LABEL } from "../../../lib/navigation";
import modalStyles from "../../../components/MovieDetailCard/MovieModal.module.css";
import styles from "./page.module.css";

const HEART_STEPS = [
  {
    title: "Heart a movie",
    text: "Tap the heart on any movie card. It fills in red once it's saved.",
  },
  {
    title: "It's saved to your profile",
    text: "Hearts belong to your account, so they follow you to any device.",
  },
  {
    title: `Find them in ${MY_MOVIES_LABEL}`,
    text: "Every movie you've hearted sits in one grid, ready for movie night.",
  },
];

// A heart beating in the corner of the homepage; clicking it explains what hearts do
export default function HeartsInfo() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={styles.beatingHeart}
        onClick={() => dialogRef.current?.showModal()}
        aria-label="How hearts work"
        title="How hearts work"
      >
        <Image src="/assets/anatomical-heart-svgrepo-com.svg" alt="" width={48} height={48} />
      </button>

      <dialog
        ref={dialogRef}
        className={`${modalStyles.dialog} ${styles.heartsDialog}`}
        // Clicking the dark backdrop closes it
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      >
        <button
          type="button"
          className={modalStyles.close}
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
        >
          ✕
        </button>

        <div className={styles.heartsContent}>
          <h2 className={styles.heading}>How hearts work</h2>
          <ol className={`${styles.steps} ${styles.stepsStacked}`}>
            {HEART_STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <Image
                  className={i === 0 ? styles.stepHeartEmpty : styles.stepHeart}
                  src="/assets/anatomical-heart-svgrepo-com.svg"
                  alt=""
                  width={40}
                  height={40}
                />
                <h3 className={styles.stepTitle}>
                  <span className={styles.stepNumber}>{i + 1}</span> {step.title}
                </h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </ol>
          <HeartsCta />
        </div>
      </dialog>
    </>
  );
}
