import "server-only";
import classicQuiz from "@data/horror-quiz.json";
import hardQuiz from "@data/horror-quiz-hard.json";
import type { QuestionBank } from "./quizModes";

// The answers live here and never go to the browser, so nobody can read them from dev tools

type QuizQuestion = (typeof classicQuiz.questions)[number];

// What a player sees before answering
export type PublicQuestion = {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
};

// Both files number their questions from 1, so each bank gets its own id range here.
// The JSON files stay as written; hard question 7 is 1007 everywhere else
const BANKS: Record<QuestionBank, { questions: QuizQuestion[]; idOffset: number }> = {
  classic: { questions: classicQuiz.questions, idOffset: 0 },
  hard: { questions: hardQuiz.questions, idOffset: 1000 },
};

const QUESTIONS = new Map<number, QuizQuestion>(
  Object.values(BANKS).flatMap(({ questions, idOffset }) =>
    questions.map((q) => [q.id + idOffset, q] as const),
  ),
);

// How many questions each bank holds, so longer quizzes can show "coming soon" until it's big enough
export const BANK_SIZES: Record<QuestionBank, number> = {
  classic: BANKS.classic.questions.length,
  hard: BANKS.hard.questions.length,
};

export function toPublicQuestion(id: number): PublicQuestion {
  const { question, options, difficulty } = QUESTIONS.get(id)!;
  return { id, question, options, difficulty };
}

export function getAnswer(id: number) {
  const { answerIndex, fact, film, year } = QUESTIONS.get(id)!;
  return { answerIndex, fact, film, year };
}

// A random pick of `count` questions in a random order (Fisher–Yates), so nobody can memorize a run
export function shuffledQuestionIds(bank: QuestionBank, count: number) {
  const { questions, idOffset } = BANKS[bank];
  const ids = questions.map((q) => q.id + idOffset);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}
