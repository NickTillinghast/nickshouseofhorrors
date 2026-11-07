"use client";

import { useEffect, useRef, useState } from "react";
import { useFavorites } from "../../../components/Favorites/FavoritesProvider";
import { formatDuration } from "../../../lib/formatDuration";
import { QUIZ_MODES, getQuizMode, type QuestionBank } from "../../../lib/quizModes";
import { UsernameForm } from "../../../components/Comments/CommentSection";
import { abandonQuiz, answerQuestion, nextQuestion, saveScore, startQuiz } from "./actions";
import styles from "./page.module.css";

type Question = Awaited<ReturnType<typeof startQuiz>>["question"];
type Feedback = Awaited<ReturnType<typeof answerQuestion>> & { choice: number };
// A saved score; the other outcome is { needsUsername: true }
type SaveResult = Extract<Awaited<ReturnType<typeof saveScore>>, { needsUsername: false }>;

// Finished-but-unsaved run, kept across the sign-in redirect so the score isn't lost
const PENDING_KEY = "quiz:pendingAttempt";

function readPending() {
  try {
    return localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

function writePending(attemptId: string | null) {
  try {
    if (attemptId) localStorage.setItem(PENDING_KEY, attemptId);
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Private mode or storage blocked, the score just can't survive a redirect
  }
}

function resultMessage(correct: number, total: number) {
  const ratio = correct / total;
  if (ratio === 1) return "Flawless. You are the final girl.";
  if (ratio >= 0.8) return "A true horror scholar.";
  if (ratio >= 0.6) return "You'd survive past the second act.";
  if (ratio >= 0.4) return "You made it to the cabin, at least.";
  return "First to die. Time for a movie marathon.";
}

type QuizGameProps = {
  // How many questions each bank holds; a quiz shows as "coming soon" until its bank is big enough
  bankSizes: Record<QuestionBank, number>;
};

export default function QuizGame({ bankSizes }: QuizGameProps) {
  const { user, openSignIn } = useFavorites();
  const [phase, setPhase] = useState<"intro" | "question" | "feedback" | "finished">("intro");
  const [mode, setMode] = useState<(typeof QUIZ_MODES)[number] | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  // The run still in progress, deleted if they leave so it never happened
  const unfinishedRef = useRef<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  // Official thinking time from the server, updated after every answer
  const [durationMs, setDurationMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  // A finished run waiting for the player to pick a username before it can be saved
  const [needsUsernameFor, setNeedsUsernameFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Live stopwatch, for show only. It runs while a question is on screen
  const [questionMs, setQuestionMs] = useState(0);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);

  // Restarts for each question; the server's time replaces it after every answer
  useEffect(() => {
    if (phase !== "question") return;
    const startedAt = performance.now();
    const timer = setInterval(() => setQuestionMs(performance.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [phase, index]);

  // Move keyboard focus along with the game
  useEffect(() => {
    if (phase === "feedback") nextButtonRef.current?.focus();
    if (phase === "question") questionRef.current?.focus();
  }, [phase, index]);

  // Leaving the page or closing the tab mid-quiz throws the run away.
  // Anything this misses (a crash, no network) is swept up by the server later
  useEffect(() => {
    function discard() {
      if (unfinishedRef.current) abandonQuiz(unfinishedRef.current);
      unfinishedRef.current = null;
    }
    window.addEventListener("pagehide", discard);
    return () => {
      window.removeEventListener("pagehide", discard);
      discard();
    };
  }, []);

  // Back from signing in with a finished run waiting: save it now
  const userId = user?.id;
  useEffect(() => {
    const pending = readPending();
    if (!userId || !pending) return;

    let cancelled = false;
    saveScore(pending)
      .then((result) => {
        if (cancelled) return;
        if (result.needsUsername) {
          setNeedsUsernameFor(pending);
          return;
        }
        writePending(null);
        setSaveResult(result);
      })
      .catch(() => writePending(null));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const liveMs = phase === "question" ? durationMs + questionMs : durationMs;

  function showQuestion(next: { question: Question; index: number; total: number }) {
    setQuestion(next.question);
    setIndex(next.index);
    setTotal(next.total);
    setFeedback(null);
    setQuestionMs(0);
    setPhase("question");
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function start(nextMode: (typeof QUIZ_MODES)[number]) {
    run(async () => {
      const first = await startQuiz(nextMode.id);
      setMode(nextMode);
      setAttemptId(first.attemptId);
      unfinishedRef.current = first.attemptId;
      setCorrectCount(0);
      setDurationMs(0);
      setSaveResult(null);
      setNeedsUsernameFor(null);
      showQuestion(first);
    });
  }

  // Give up mid-quiz: the run is deleted and they're back at the quiz picker
  function quit() {
    if (unfinishedRef.current) abandonQuiz(unfinishedRef.current);
    unfinishedRef.current = null;
    setAttemptId(null);
    setQuestion(null);
    setFeedback(null);
    setError(null);
    setPhase("intro");
  }

  function choose(choice: number) {
    if (!attemptId || !question || busy) return;
    run(async () => {
      const result = await answerQuestion(attemptId, question.id, choice);
      setFeedback({ ...result, choice });
      setCorrectCount(result.correctCount);
      setDurationMs(result.durationMs);
      setPhase("feedback");
    });
  }

  function next() {
    if (!attemptId || !feedback) return;
    if (feedback.done) {
      finish(attemptId);
      return;
    }
    run(async () => showQuestion(await nextQuestion(attemptId)));
  }

  function finish(id: string) {
    unfinishedRef.current = null;
    setPhase("finished");
    if (user) {
      save(id);
    } else {
      // Remember the run so it can be saved after signing in
      writePending(id);
    }
  }

  function save(id: string) {
    setSaving(true);
    saveScore(id)
      .then((result) => {
        if (result.needsUsername) {
          // Keep the run so it survives a reload while they pick a name
          writePending(id);
          setNeedsUsernameFor(id);
          return;
        }
        writePending(null);
        setNeedsUsernameFor(null);
        setSaveResult(result);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't save your score"))
      .finally(() => setSaving(false));
  }

  if (phase === "intro") {
    return (
      <div className={styles.game}>
        <p className={styles.intro}>
          Pick your poison. The clock only runs while a question is on screen, so take your time
          reading the facts. Most correct wins, fastest breaks ties.
        </p>

        <ul className={styles.modes}>
          {QUIZ_MODES.map((option) => {
            const comingSoon = option.count > bankSizes[option.bank];
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={`${styles.modeCard} ${styles[option.tier]}`}
                  onClick={() => start(option)}
                  disabled={busy || comingSoon}
                >
                  {option.tier === "legend" && (
                    <span className={styles.modeBadge}>
                      {comingSoon ? "Coming soon" : "Only legends survive"}
                    </span>
                  )}
                  {option.tier === "elite" && (
                    <span className={`${styles.modeBadge} ${styles.modeBadgeElite}`}>
                      For true horror fans
                    </span>
                  )}
                  <span className={styles.modeName}>{option.name}</span>
                  <span className={styles.modeCount}>
                    {option.count} {option.bank === "hard" ? "hard " : ""}questions
                  </span>
                  <span className={styles.modeTagline}>{option.tagline}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {busy && <p className={styles.hint}>Summoning your questions…</p>}
        {!user && (
          <p className={styles.hint}>Anyone can play. Sign in at the end to save your score.</p>
        )}
        {needsUsernameFor && (
          <UsernameForm
            label="Pick a username for the leaderboard"
            onSaved={() => save(needsUsernameFor)}
          />
        )}
        {saveResult && (
          <p className={styles.saved}>
            Score saved! You&apos;re #{saveResult.rank} on the {getQuizMode(saveResult.mode)?.name}{" "}
            leaderboard.
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (phase === "finished" && feedback) {
    return (
      <div className={styles.game}>
        <p className={styles.resultLabel}>{mode?.name} · Final score</p>
        <p className={styles.resultScore}>
          {feedback.correctCount}
          <span>/{feedback.total}</span>
        </p>
        <p className={styles.resultTime}>in {formatDuration(feedback.durationMs)}</p>
        <p className={styles.resultMessage}>
          {resultMessage(feedback.correctCount, feedback.total)}
        </p>

        <div className={styles.saveArea} aria-live="polite">
          {saving && <p>Saving your score…</p>}
          {saveResult && (
            <p className={styles.saved}>
              {saveResult.improved
                ? `New personal best! You're #${saveResult.rank} on the ${mode?.name} leaderboard.`
                : `Your best is still ${saveResult.bestCorrect}/${feedback.total} in ${formatDuration(saveResult.bestDurationMs)}, #${saveResult.rank} on the ${mode?.name} leaderboard.`}
            </p>
          )}
          {saveResult && mode?.badge && (
            <p className={styles.badgeEarned}>
              🩸 You survived all {mode.count}. The {mode.badge} badge now sits next to your name on
              every leaderboard.
            </p>
          )}
          {needsUsernameFor && (
            <UsernameForm
              label="Pick a username for the leaderboard"
              onSaved={() => save(needsUsernameFor)}
            />
          )}
          {!user && !saveResult && (
            <>
              <p>Sign in to put this score on the leaderboard.</p>
              <button type="button" className={styles.startButton} onClick={openSignIn}>
                Sign in to save
              </button>
            </>
          )}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.resultActions}>
          {mode && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => start(mode)}
              disabled={busy}
            >
              Play {mode.name} again
            </button>
          )}
          <button type="button" className={styles.secondaryButton} onClick={quit} disabled={busy}>
            Choose another quiz
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className={styles.game}>
      <div className={styles.status}>
        <span>
          {mode?.name} · Question {index + 1} of {total}
        </span>
        <span>{correctCount} correct</span>
        <span className={styles.timer} aria-label="Time">
          {formatDuration(liveMs)}
        </span>
      </div>
      <progress className={styles.progress} value={index + (feedback ? 1 : 0)} max={total} />

      <h2 ref={questionRef} tabIndex={-1} className={styles.question}>
        {question.question}
      </h2>
      <p className={styles.difficulty}>{question.difficulty}</p>

      <ul className={styles.options}>
        {question.options.map((option, i) => {
          let state = "";
          if (feedback) {
            if (i === feedback.answerIndex) state = styles.optionCorrect;
            else if (i === feedback.choice) state = styles.optionWrong;
          }
          return (
            <li key={option}>
              <button
                type="button"
                className={`${styles.option} ${state}`}
                onClick={() => choose(i)}
                disabled={!!feedback || busy}
              >
                <span className={styles.optionLetter}>{"ABCD"[i]}</span>
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {feedback && (
        <div className={styles.feedback} aria-live="polite">
          <p className={feedback.correct ? styles.correctText : styles.wrongText}>
            {feedback.correct ? "Correct!" : "Wrong!"}{" "}
            <span className={styles.film}>
              {feedback.film} ({feedback.year})
            </span>
          </p>
          <p className={styles.fact}>{feedback.fact}</p>
          <button
            ref={nextButtonRef}
            type="button"
            className={styles.startButton}
            onClick={next}
            disabled={busy}
          >
            {feedback.done ? "See my score" : "Next question"}
          </button>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="button" className={styles.quit} onClick={quit}>
        Quit (this run won&apos;t count)
      </button>
    </div>
  );
}
