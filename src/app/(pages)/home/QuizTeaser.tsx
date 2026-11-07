import Link from "next/link";
import { getLeaderboard } from "../../../lib/leaderboard";
import { formatDuration } from "../../../lib/formatDuration";
import { FINAL_GIRL, UNKILLABLE } from "../../../lib/quizModes";
import styles from "./page.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

// Homepage card that sends people to /quiz, with the top 3 from the longest run as bait
export default async function QuizTeaser({ titleClassName }: { titleClassName?: string }) {
  // Show the toughest board that has anyone on it: Unkillable, then Final Girl
  const [unkillable, finalGirl] = await Promise.all([
    getLeaderboard(UNKILLABLE, 3),
    getLeaderboard(FINAL_GIRL, 3),
  ]);
  const leaders = unkillable.length > 0 ? unkillable : finalGirl;
  const boardName = unkillable.length > 0 ? "Unkillables" : "Final Girls";

  return (
    <section className={`${styles.section} ${styles.quizCard}`} aria-labelledby="quiz-heading">
      <h2 id="quiz-heading" className={`${styles.heading} ${titleClassName ?? ""}`}>
        Think you know horror?
      </h2>
      <p className={styles.quizText}>
        From Evil Dead to The Wicker Man. Take a quick Jump Scare, settle in for a Midnight Movie,
        survive 50 as the Final Girl, or prove you&apos;re Unkillable with all 100.
      </p>

      <p className={styles.quizLeadersTitle}>🩸 Top {boardName}</p>
      {leaders.length > 0 ? (
        <ol className={styles.quizLeaders}>
          {leaders.map((leader, i) => (
            <li key={leader.user_id}>
              <span>{MEDALS[i]}</span>
              <span className={styles.quizLeaderName}>{leader.username}</span>
              <span>
                {leader.correct}/{leader.total}
              </span>
              <span className={styles.quizLeaderTime}>{formatDuration(leader.duration_ms)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.quizText}>Nobody has survived the long runs yet. Will you be first?</p>
      )}

      <Link href="/quiz" className={styles.primaryButton}>
        Take the quiz
      </Link>
    </section>
  );
}
