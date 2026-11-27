// Prices, limits, types and formatting for Top 10 lists.
// Kept apart from userLists.ts (cached server reads) so browser components can import them too

// While false, the checkout and promote pages show "coming soon" and the server refuses
// purchases. Turn on once Stripe is set up (see docs/payments.md)
export const LIST_SALES_OPEN = true;

// Prices and durations, change them here. Stripe takes 2.9% + 30¢ of each
export const FIRST_LIST_PRICE_CENTS = 499;
export const EXTRA_LIST_PRICE_CENTS = 299;
export const PROMOTE_PRICE_CENTS = 499;
// A first list comes with this many days in a promoted spot
export const FIRST_LIST_PROMO_DAYS = 14;
// "Promote" buys this many days
export const PROMOTE_DAYS = 14;
export const LIST_SIZE = 10;
export const MAX_LIST_GENRES = 3;
export const LIST_TITLE_MAX = 60;

export type ListKind = "first_list" | "extra_list";
// Everything that can be bought. "promote" was "promote_30" when promotions were 30 days
export type PurchaseKind = ListKind | "promote";

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
