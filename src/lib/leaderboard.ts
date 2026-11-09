import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { QuizModeId } from "./quizModes";

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
