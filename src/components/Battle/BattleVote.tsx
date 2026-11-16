"use client";

import { useState } from "react";
import { useFavorites } from "@components/Favorites/FavoritesProvider";
import type { BattleSide } from "@lib/battleShared";
import { useBattleVotes } from "./BattleVotesProvider";
import styles from "./Battle.module.css";

type BattleVoteProps = {
  battleId: number;
  leftName: string;
  rightName: string;
};

// The two vote buttons and the standings bar. Everyone sees who's winning, voted or not
export default function BattleVote({ battleId, leftName, rightName }: BattleVoteProps) {
  const { user } = useFavorites();
  const { counts, myVote, vote } = useBattleVotes();
  const [error, setError] = useState<string | null>(null);

  const tally = counts(battleId);
  const mine = myVote(battleId);
  const total = tally ? tally.left + tally.right : 0;
  // An even split until the first vote comes in
  const leftShare = total ? Math.round((tally!.left / total) * 100) : 50;
  const rightShare = total ? 100 - leftShare : 50;

  async function pick(side: BattleSide) {
    setError(null);
    const message = await vote(battleId, side);
    if (message) setError(message);
  }

  function button(side: BattleSide, name: string) {
    const picked = mine === side;
    return (
      <button
        type="button"
        className={`${styles.voteButton} ${picked ? styles.picked : ""}`}
        aria-pressed={picked}
        aria-label={`Vote for ${name}`}
        onClick={() => pick(side)}
      >
        {picked ? "✓ Your pick" : "Vote"}
      </button>
    );
  }

  return (
    <div className={styles.vote}>
      <div className={styles.voteButtons}>
        {button("left", leftName)}
        {button("right", rightName)}
      </div>

      <div
        className={styles.bar}
        role="img"
        aria-label={
          tally
            ? `${leftName} ${leftShare}%, ${rightName} ${rightShare}%, ${total} votes`
            : "Loading votes"
        }
      >
        <span className={styles.barLeft} style={{ width: `${leftShare}%` }} />
        <span className={styles.barRight} style={{ width: `${rightShare}%` }} />
      </div>

      <p className={styles.standings} aria-live="polite">
        {tally && total === 0 ? (
          <span className={styles.total}>No votes yet. Be the first.</span>
        ) : tally ? (
          <>
            <span>
              <strong>{leftShare}%</strong> {tally.left.toLocaleString()}
            </span>
            <span className={styles.total}>
              {total === 1 ? "1 vote" : `${total.toLocaleString()} votes`}
            </span>
            <span>
              {tally.right.toLocaleString()} <strong>{rightShare}%</strong>
            </span>
          </>
        ) : (
          <span className={styles.total}>Counting the bodies…</span>
        )}
      </p>

      <p className={styles.voteHint}>
        {error ??
          (!user
            ? "Sign in to vote."
            : mine
              ? "Changed your mind? Tap the other fighter."
              : "Who walks away? Cast your vote.")}
      </p>
    </div>
  );
}
