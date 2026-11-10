import { Suspense } from "react";
import type { Metadata } from "next";
import { Creepster } from "next/font/google";
import { BANK_SIZES } from "@lib/quiz";
import { QUIZ_MODES } from "@lib/quizModes";
import QuizGame from "./QuizGame";
import Leaderboard from "./Leaderboard";
import styles from "./page.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Horror Movie Trivia Quiz: 10 to 100 Questions",
  description:
    "Think you know horror? Take a quick Jump Scare or a Midnight Movie, survive 50 questions as the Final Girl, or prove you're Unkillable with all 100. Beat the clock and climb the leaderboards.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={`${styles.title} ${creepster.className}`}>Horror Trivia</h1>
        <p className={styles.subtitle}>Think you know horror? Prove it.</p>
      </header>

      <div className={styles.layout}>
        <section aria-labelledby="quiz-heading" className={styles.column}>
          <h2 id="quiz-heading" className={`${styles.boardTitle} ${creepster.className}`}>
            Take the Quiz
          </h2>
          <div className={styles.panel}>
            {/* Only the size of each question bank goes to the browser, never the questions */}
            <QuizGame bankSizes={BANK_SIZES} />
          </div>
        </section>

        <section
          aria-labelledby="leaderboard-heading"
          className={`${styles.column} ${styles.boards}`}
        >
          <h2 id="leaderboard-heading" className={`${styles.boardTitle} ${creepster.className}`}>
            Leaderboards
          </h2>
          {/* Longest first and biggest: the long runs are where the real fans are */}
          <Suspense fallback={<p className={styles.empty}>Loading scores…</p>}>
            {QUIZ_MODES.map((mode) => (
              <Leaderboard key={mode.id} mode={mode.id} limit={mode.badge ? 10 : 5} />
            ))}
          </Suspense>
        </section>
      </div>
    </main>
  );
}
