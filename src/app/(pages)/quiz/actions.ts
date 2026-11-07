"use server";

import { updateTag } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";
import { BANK_SIZES, getAnswer, shuffledQuestionIds, toPublicQuestion } from "../../../lib/quiz";
import { LEADERBOARD_TAG } from "../../../lib/leaderboard";
import { getQuizMode, type QuizModeId } from "../../../lib/quizModes";

// The server keeps score and the clock. The browser only ever sees one question at a time
// and learns the answer after it has locked one in.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Quizzes left unfinished are deleted, as if they never happened
const ABANDONED_AFTER_MS = 2 * 60 * 60 * 1000;
// Finished runs wait this long for a signed-out player to sign in and save
const UNSAVED_KEPT_MS = 24 * 60 * 60 * 1000;

type Attempt = {
  id: string;
  user_id: string | null;
  mode: QuizModeId;
  question_order: number[];
  current_index: number;
  correct_count: number;
  question_shown_at: string | null;
  duration_ms: number;
  finished_at: string | null;
  saved: boolean;
};

async function loadAttempt(attemptId: string) {
  if (!UUID.test(attemptId)) throw new Error("Unknown quiz");
  const { data } = await createAdminClient()
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .single<Attempt>();
  if (!data) throw new Error("Unknown quiz");
  return data;
}

async function getSignedInUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Leaderboards show the username from profiles, never a real name
async function hasUsername(userId: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data);
}

// Sweeps out quizzes nobody finished, and finished ones nobody saved, so they leave no trace
async function deleteStaleAttempts() {
  const admin = createAdminClient();
  const now = Date.now();
  await Promise.all([
    admin
      .from("quiz_attempts")
      .delete()
      .is("finished_at", null)
      .lt("started_at", new Date(now - ABANDONED_AFTER_MS).toISOString()),
    admin
      .from("quiz_attempts")
      .delete()
      .eq("saved", false)
      .lt("finished_at", new Date(now - UNSAVED_KEPT_MS).toISOString()),
  ]);
}

export async function startQuiz(modeId: string) {
  const mode = getQuizMode(modeId);
  if (!mode) throw new Error("Unknown quiz");
  if (mode.count > BANK_SIZES[mode.bank]) throw new Error(`${mode.name} is coming soon`);

  const user = await getSignedInUser();
  const order = shuffledQuestionIds(mode.bank, mode.count);
  await deleteStaleAttempts();

  const { data, error } = await createAdminClient()
    .from("quiz_attempts")
    .insert({
      user_id: user?.id ?? null,
      mode: mode.id,
      question_order: order,
      question_shown_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Couldn't start the quiz");

  return {
    attemptId: data.id as string,
    index: 0,
    total: order.length,
    question: toPublicQuestion(order[0]),
  };
}

// Walked away mid-quiz: delete it so it never happened. Finished runs are left alone
export async function abandonQuiz(attemptId: string) {
  if (!UUID.test(attemptId)) return;
  await createAdminClient()
    .from("quiz_attempts")
    .delete()
    .eq("id", attemptId)
    .is("finished_at", null);
}

// Shows the next question and starts its clock. Asking twice doesn't restart the clock
export async function nextQuestion(attemptId: string) {
  const attempt = await loadAttempt(attemptId);
  if (attempt.finished_at) throw new Error("This quiz is already finished");

  const questionId = attempt.question_order[attempt.current_index];

  if (!attempt.question_shown_at) {
    await createAdminClient()
      .from("quiz_attempts")
      .update({ question_shown_at: new Date().toISOString() })
      .eq("id", attemptId)
      .is("question_shown_at", null);
  }

  return {
    index: attempt.current_index,
    total: attempt.question_order.length,
    question: toPublicQuestion(questionId),
  };
}

export async function answerQuestion(attemptId: string, questionId: number, choice: number) {
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) throw new Error("Invalid answer");

  const attempt = await loadAttempt(attemptId);
  if (attempt.finished_at) throw new Error("This quiz is already finished");
  if (attempt.question_order[attempt.current_index] !== questionId || !attempt.question_shown_at) {
    throw new Error("That isn't the current question");
  }

  // Only time spent on the question counts, not time reading the fun fact afterwards
  const thinkingMs = Math.max(0, Date.now() - new Date(attempt.question_shown_at).getTime());
  const { answerIndex, fact, film, year } = getAnswer(questionId);
  const correct = choice === answerIndex;
  const nextIndex = attempt.current_index + 1;
  const done = nextIndex >= attempt.question_order.length;
  const correctCount = attempt.correct_count + (correct ? 1 : 0);
  const durationMs = attempt.duration_ms + thinkingMs;

  // Conditional on current_index, so a double-click can't answer the same question twice
  const { data: updated } = await createAdminClient()
    .from("quiz_attempts")
    .update({
      current_index: nextIndex,
      correct_count: correctCount,
      duration_ms: durationMs,
      question_shown_at: null,
      finished_at: done ? new Date().toISOString() : null,
    })
    .eq("id", attemptId)
    .eq("current_index", attempt.current_index)
    .select("id");
  if (!updated?.length) throw new Error("That question was already answered");

  return {
    correct,
    answerIndex,
    fact,
    film,
    year,
    done,
    correctCount,
    durationMs,
    total: attempt.question_order.length,
  };
}

// Puts a finished quiz on its leaderboard. Keeps each player's best run per quiz length.
// Players without a username get { needsUsername: true } and are asked to pick one first
export async function saveScore(attemptId: string) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Sign in to save your score");
  if (!(await hasUsername(user.id))) return { needsUsername: true as const };

  const attempt = await loadAttempt(attemptId);
  if (!attempt.finished_at) throw new Error("Finish the quiz first");
  if (attempt.user_id && attempt.user_id !== user.id) throw new Error("Not your quiz");

  const admin = createAdminClient();

  if (!attempt.saved) {
    await admin.from("quiz_attempts").update({ saved: true, user_id: user.id }).eq("id", attemptId);

    const { data: best } = await admin
      .from("quiz_scores")
      .select("correct, duration_ms")
      .eq("user_id", user.id)
      .eq("mode", attempt.mode)
      .maybeSingle();

    const isBetter =
      !best ||
      attempt.correct_count > best.correct ||
      (attempt.correct_count === best.correct && attempt.duration_ms < best.duration_ms);

    if (isBetter) {
      await admin.from("quiz_scores").upsert({
        user_id: user.id,
        mode: attempt.mode,
        attempt_id: attempt.id,
        correct: attempt.correct_count,
        total: attempt.question_order.length,
        duration_ms: attempt.duration_ms,
        achieved_at: new Date().toISOString(),
      });
      // Show the new score on the leaderboard right away
      updateTag(LEADERBOARD_TAG);
    }
  }

  // Rank of the player's best run: everyone with more correct, or as many but faster, is ahead
  const { data: best } = await admin
    .from("quiz_scores")
    .select("correct, duration_ms")
    .eq("user_id", user.id)
    .eq("mode", attempt.mode)
    .single();
  if (!best) throw new Error("Couldn't save your score");

  const { count } = await admin
    .from("quiz_scores")
    .select("user_id", { count: "exact", head: true })
    .eq("mode", attempt.mode)
    .or(
      `correct.gt.${best.correct},and(correct.eq.${best.correct},duration_ms.lt.${best.duration_ms})`,
    );

  return {
    needsUsername: false as const,
    mode: attempt.mode,
    rank: (count ?? 0) + 1,
    bestCorrect: best.correct as number,
    bestDurationMs: best.duration_ms as number,
    improved: best.correct === attempt.correct_count && best.duration_ms === attempt.duration_ms,
  };
}
