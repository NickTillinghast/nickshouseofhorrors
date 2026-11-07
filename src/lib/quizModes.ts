// Which question file a quiz draws from: the original 50, or the 100 harder deep cuts
export type QuestionBank = "classic" | "hard";

// The four quiz lengths, longest first. Safe for the browser: names and sizes only, no questions.
// Finishing one of the two long runs earns a badge shown next to your name on every leaderboard
export const QUIZ_MODES = [
  {
    id: "unkillable",
    name: "Unkillable",
    count: 100,
    bank: "hard",
    tagline: "100 brutal deep cuts. Like every great slasher, you just keep coming back.",
    tier: "legend",
    badge: "Unkillable",
  },
  {
    id: "final-girl",
    name: "Final Girl",
    count: 50,
    bank: "classic",
    tagline: "50 questions. Only the strongest survive to the end.",
    tier: "elite",
    badge: "Final Girl",
  },
  {
    id: "midnight-movie",
    name: "Midnight Movie",
    count: 25,
    bank: "classic",
    tagline: "25 questions. Dim the lights and settle in.",
    tier: "fan",
    badge: null,
  },
  {
    id: "jump-scare",
    name: "Jump Scare",
    count: 10,
    bank: "classic",
    tagline: "10 questions. A quick jolt, over in a couple of minutes.",
    tier: "rookie",
    badge: null,
  },
] as const;

export type QuizMode = (typeof QUIZ_MODES)[number];
export type QuizModeId = QuizMode["id"];

export const FINAL_GIRL: QuizModeId = "final-girl";
export const UNKILLABLE: QuizModeId = "unkillable";

// Modes that award a badge, best first
export const BADGE_MODES = QUIZ_MODES.filter((mode) => mode.badge);

export function getQuizMode(id: string) {
  return QUIZ_MODES.find((mode) => mode.id === id);
}
