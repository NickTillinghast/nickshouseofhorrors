import { getLeaderboard } from "@lib/leaderboard";
import { formatDuration } from "@lib/formatDuration";
import { getQuizMode, type QuizModeId } from "@lib/quizModes";
import styles from "./page.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

// Gold for Unkillable, blood red for Final Girl, bone for Midnight Movie, gray for Jump Scare
const CARD_STYLE: Partial<Record<QuizModeId, string>> = {
  unkillable: styles.boardCardLegend,
  "final-girl": styles.boardCardElite,
  "midnight-movie": styles.boardCardMidnight,
  "jump-scare": styles.boardCardJump,
};

// Every name on a board finished that run, so each row gets that board's pill
const PILL_STYLE: Record<QuizModeId, string> = {
  unkillable: styles.badgeLegend,
  "final-girl": styles.badgeElite,
  "midnight-movie": styles.badgeMidnight,
  "jump-scare": styles.badgeJump,
};

const BOARD_NOTE: Partial<Record<QuizModeId, string>> = {
  unkillable: "The immortals. Only those who made it through all 100 appear here.",
  "final-girl": "The hall of survivors. Only finishers of all 50 appear here.",
  "midnight-movie": "The midnight movie survivors. Only finishers of all 25 questions appear here.",
  "jump-scare": "The jump scare survivors. Only finishers of all 10 questions appear here.",
};

type LeaderboardProps = {
  mode: QuizModeId;
  limit?: number;
};

export default async function Leaderboard({ mode, limit = 10 }: LeaderboardProps) {
  const entries = await getLeaderboard(mode, limit);
  const quizMode = getQuizMode(mode)!;

  return (
    <section
      className={`${styles.boardCard} ${CARD_STYLE[mode] ?? ""}`}
      aria-labelledby={`board-${mode}`}
    >
      <h3 id={`board-${mode}`} className={styles.boardName}>
        {quizMode.badge && <span aria-hidden="true">🩸 </span>}
        {quizMode.name}
        <span className={styles.boardCount}>{quizMode.count} questions</span>
      </h3>
      {BOARD_NOTE[mode] && <p className={styles.boardNote}>{BOARD_NOTE[mode]}</p>}

      {entries.length === 0 ? (
        <p className={styles.empty}>No scores yet. Be the first name on the board.</p>
      ) : (
        <ol className={styles.board}>
          {entries.map((entry, i) => {
            return (
              <li key={entry.user_id} className={styles.boardRow}>
                <span className={styles.rank}>{MEDALS[i] ?? `#${i + 1}`}</span>
                {/* First letter of the username, no photos, so nobody's real face is on the board */}
                <span className={styles.avatar} aria-hidden="true">
                  {entry.username[0]?.toUpperCase()}
                </span>
                <span className={styles.player}>
                  {entry.username}
                  <span
                    className={`${styles.badge} ${PILL_STYLE[mode]}`}
                    title={`Survived all ${quizMode.count} questions of ${quizMode.name}`}
                  >
                    {quizMode.name}
                  </span>
                </span>
                <span className={styles.score}>
                  {entry.correct}/{entry.total}
                </span>
                <span className={styles.time}>{formatDuration(entry.duration_ms)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
