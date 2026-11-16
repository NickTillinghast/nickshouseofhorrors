"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@lib/supabase/client";
import { useFavorites } from "@components/Favorites/FavoritesProvider";
import type { BattleCounts, BattleSide } from "@lib/battleShared";
import { castVote } from "./actions";

type BattleVotesContextValue = {
  // undefined while loading
  counts: (battleId: number) => BattleCounts | undefined;
  myVote: (battleId: number) => BattleSide | undefined;
  vote: (battleId: number, side: BattleSide) => Promise<string | undefined>;
};

const BattleVotesContext = createContext<BattleVotesContextValue | null>(null);

type CountRow = { battle_id: number; left_votes: number; right_votes: number };

async function fetchCounts(battleIds: number[]) {
  const { data } = await createClient().rpc("battle_vote_counts", { battle_ids: battleIds });
  const counts = new Map<number, BattleCounts>(battleIds.map((id) => [id, { left: 0, right: 0 }]));
  for (const row of (data ?? []) as CountRow[]) {
    counts.set(row.battle_id, { left: Number(row.left_votes), right: Number(row.right_votes) });
  }
  return counts;
}

// Loaded in the browser, like hearts and comments, so the pages stay cached for everyone
// and the standings are always current. One request covers every battle on the page
export default function BattleVotesProvider({
  battleIds,
  children,
}: {
  battleIds: number[];
  children: ReactNode;
}) {
  const { user, openSignIn } = useFavorites();
  const [counts, setCounts] = useState<Map<number, BattleCounts> | null>(null);
  // Tagged with the user they belong to, so a sign-out never shows someone else's votes
  const [votes, setVotes] = useState<{ userId: string; sides: Map<number, BattleSide> } | null>(
    null,
  );
  const idsKey = battleIds.join(",");
  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;
    const ids = idsKey ? idsKey.split(",").map(Number) : [];
    if (!ids.length) return;
    fetchCounts(ids).then((result) => {
      if (!cancelled) setCounts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  useEffect(() => {
    if (!userId || !idsKey) return;
    let cancelled = false;
    createClient()
      .from("battle_votes")
      .select("battle_id, side")
      .in("battle_id", idsKey.split(",").map(Number))
      .then(({ data }) => {
        if (cancelled) return;
        const sides = new Map<number, BattleSide>();
        for (const row of (data ?? []) as { battle_id: number; side: BattleSide }[]) {
          sides.set(row.battle_id, row.side);
        }
        setVotes({ userId, sides });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, idsKey]);

  const mySides = votes && votes.userId === userId ? votes.sides : null;

  async function vote(battleId: number, side: BattleSide) {
    if (!user) {
      openSignIn();
      return;
    }
    const previous = mySides?.get(battleId);
    if (previous === side) return;

    // Show the vote right away, then put things back if saving fails
    const before = { counts, votes };
    setVotes({ userId: user.id, sides: new Map(mySides ?? []).set(battleId, side) });
    setCounts((current) => {
      const next = new Map(current ?? []);
      const tally = { ...(next.get(battleId) ?? { left: 0, right: 0 }) };
      tally[side] += 1;
      if (previous) tally[previous] = Math.max(0, tally[previous] - 1);
      return next.set(battleId, tally);
    });

    const result = await castVote(battleId, side);
    if (result.error) {
      setCounts(before.counts);
      setVotes(before.votes);
      return result.error;
    }
    // Catch up with everyone else's votes on this battle
    const fresh = await fetchCounts([battleId]);
    setCounts((current) => new Map(current ?? []).set(battleId, fresh.get(battleId)!));
  }

  return (
    <BattleVotesContext
      value={{
        counts: (battleId) => counts?.get(battleId),
        myVote: (battleId) => mySides?.get(battleId),
        vote,
      }}
    >
      {children}
    </BattleVotesContext>
  );
}

export function useBattleVotes() {
  const context = useContext(BattleVotesContext);
  if (!context) throw new Error("useBattleVotes must be inside BattleVotesProvider");
  return context;
}
