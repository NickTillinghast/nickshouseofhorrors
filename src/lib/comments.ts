// Shared by the browser and server actions, see supabase/migrations/002 and 003

export const COMMENT_MAX_LENGTH = 1000;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const THREAD_PATTERN = /^(movie:[0-9]+|list:[a-z0-9-]+)$/;

export type Comment = {
  id: number;
  thread: string;
  user_id: string;
  parent_id: number | null;
  body: string;
  created_at: string;
  profiles: { username: string } | null;
};

// The columns the comment section reads, with the author's username joined in
export const COMMENT_COLUMNS =
  "id, thread, user_id, parent_id, body, created_at, profiles(username)";

export function movieThread(tmdbId: number) {
  return `movie:${tmdbId}`;
}

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

// "3 hours ago", "yesterday", "just now"
export function timeAgo(date: string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
