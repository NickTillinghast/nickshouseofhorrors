import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { BADGE_MODES, type QuizModeId } from "./quizModes";

export const LEADERBOARD_TAG = "quiz-leaderboard";

export type LeaderboardEntry = {
  user_id: string;
  // The player's username from profiles, never their real name
  username: string;
  correct: number;
  total: number;
  duration_ms: number;
};

// Public reads (Row Level Security allows them), no login cookie needed
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Best scores for one quiz length, cached until someone saves a new score
export async function getLeaderboard(mode: QuizModeId, limit = 20): Promise<LeaderboardEntry[]> {
  "use cache";
  cacheTag(LEADERBOARD_TAG);
  cacheLife("hours");

  const supabase = publicClient();
  const { data: scores } = await supabase
    .from("quiz_scores")
    .select("user_id, correct, total, duration_ms")
    .eq("mode", mode)
    .order("correct", { ascending: false })
    .order("duration_ms", { ascending: true })
    .limit(limit);
  if (!scores?.length) return [];

  // Usernames are looked up live, so a username picked or changed later shows everywhere
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      "id",
      scores.map((score) => score.user_id),
    );
  const usernames = new Map((profiles ?? []).map((p) => [p.id as string, p.username as string]));

  return scores.map((score) => ({
    ...score,
    username: usernames.get(score.user_id) ?? "Nameless Victim",
  }));
}

// Each player's best badge (Unkillable beats Final Girl), shown next to their name on every board
export async function getBadges(): Promise<Record<string, QuizModeId>> {
  "use cache";
  cacheTag(LEADERBOARD_TAG);
  cacheLife("hours");

  const { data } = await publicClient()
    .from("quiz_scores")
    .select("user_id, mode")
    .in(
      "mode",
      BADGE_MODES.map((mode) => mode.id),
    );

  // BADGE_MODES is best first, so the first badge a player gets is their best
  const badges: Record<string, QuizModeId> = {};
  for (const mode of BADGE_MODES) {
    for (const row of data ?? []) {
      if (row.mode === mode.id && !badges[row.user_id]) badges[row.user_id] = mode.id;
    }
  }
  return badges;
}
