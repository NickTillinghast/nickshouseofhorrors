// Prices, limits, types and formatting for Top 10 lists.
// Kept apart from userLists.ts (cached server reads) so browser components can import them too

// Placeholder prices and durations, change them here
export const FIRST_LIST_PRICE_CENTS = 499;
export const EXTRA_LIST_PRICE_CENTS = 200;
export const PROMOTE_PRICE_CENTS = 999;
// A first list comes with this many days in a promoted spot
export const FIRST_LIST_PROMO_DAYS = 14;
// "Promote" buys this many days
export const PROMOTE_DAYS = 30;
export const LIST_SIZE = 10;
export const MAX_LIST_GENRES = 3;
export const LIST_TITLE_MAX = 60;

export type ListKind = "first_list" | "extra_list";

export type UserListMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
};

export type UserList = {
  id: number;
  title: string;
  genreIds: number[];
  username: string;
  publishedAt: string | null;
  movies: UserListMovie[];
};

export type PromotedList = UserList & { promotedUntil: string };

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
