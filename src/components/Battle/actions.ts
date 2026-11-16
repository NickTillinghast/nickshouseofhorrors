"use server";

import { createClient } from "@lib/supabase/server";
import type { BattleSide } from "@lib/battleShared";

// Errors come back as values, thrown errors lose their message in production
type Result = { error?: string };

// Casts a vote, or switches sides if they already voted. Row Level Security makes sure
// it's their own vote on a published battle
export async function castVote(battleId: number, side: BattleSide): Promise<Result> {
  if (!Number.isInteger(battleId)) return { error: "Unknown battle." };
  if (side !== "left" && side !== "right") return { error: "Pick a fighter." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Sign in to vote." };

  const { error } = await supabase
    .from("battle_votes")
    .upsert(
      { battle_id: battleId, user_id: userId, side, updated_at: new Date().toISOString() },
      { onConflict: "battle_id,user_id" },
    );
  if (error) return { error: "Couldn't save your vote, try again." };
  return {};
}
