"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import horrorFilters from "@data/horrorFilters.json";
import { getListOffer, PROMOTE_OFFER } from "@lib/listPurchases";
import { createCheckoutSession } from "@lib/stripe";
import { createAdminClient } from "@lib/supabase/admin";
import { createClient } from "@lib/supabase/server";
import {
  LIST_SALES_OPEN,
  LIST_SIZE,
  LIST_TITLE_MAX,
  MAX_LIST_GENRES,
  USER_LISTS_TAG,
  type UserListMovie,
} from "@lib/userLists";

// Errors come back as values, thrown errors lose their message in production
type Result = { error?: string };

const GENRE_IDS = new Set(horrorFilters.subgenres.map((genre) => genre.id));

async function getSignedInUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  return {
    supabase,
    userId: data?.claims?.sub,
    // Fills in the email on Stripe's page, so their receipt goes to the right place
    email: typeof email === "string" && email ? email : undefined,
  };
}

async function hasUsername(userId: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data);
}

// Sends the fan to Stripe to pay for a new list. The price is worked out here, never taken
// from the browser. The list is created once Stripe confirms the payment (src/lib/stripe.ts)
export async function buyList(): Promise<Result> {
  if (!LIST_SALES_OPEN) return { error: "Making a Top 10 is coming soon." };
  const { userId, email } = await getSignedInUserId();
  if (!userId) return { error: "Sign in first." };
  if (!(await hasUsername(userId))) return { error: "Pick a username first." };

  const offer = await getListOffer(userId);
  let url: string;
  try {
    url = await createCheckoutSession({
      kind: offer.kind,
      userId,
      email,
      amountCents: offer.amountCents,
      name: offer.kind === "first_list" ? "Your first Top 10 list" : "Another Top 10 list",
      description:
        offer.kind === "first_list"
          ? `A Top 10 horror list on Nicks House of Horrors, promoted for ${offer.promoDays} days once you publish it`
          : "A Top 10 horror list on Nicks House of Horrors",
      cancelPath: "/lists/new/checkout",
    });
  } catch (error) {
    console.error("Couldn't start a list checkout:", error);
    return { error: "Couldn't start the payment, try again." };
  }
  redirect(url);
}

export type ListDraft = {
  title: string;
  genreIds: number[];
  movies: UserListMovie[];
};

// Server Actions can be called with anything, so check the shape before it reaches the database
function validateDraft(draft: ListDraft): string | null {
  if (typeof draft?.title !== "string" || draft.title.trim().length > LIST_TITLE_MAX) {
    return `Titles can be up to ${LIST_TITLE_MAX} characters.`;
  }
  if (
    !Array.isArray(draft.genreIds) ||
    draft.genreIds.length > MAX_LIST_GENRES ||
    !draft.genreIds.every((id) => GENRE_IDS.has(id))
  ) {
    return `Pick up to ${MAX_LIST_GENRES} genres.`;
  }
  if (!Array.isArray(draft.movies) || draft.movies.length > LIST_SIZE) {
    return `A list holds up to ${LIST_SIZE} movies.`;
  }
  const ids = new Set<number>();
  for (const movie of draft.movies) {
    const valid =
      Number.isInteger(movie?.id) &&
      movie.id > 0 &&
      typeof movie.title === "string" &&
      movie.title.length > 0 &&
      movie.title.length <= 500 &&
      !ids.has(movie.id);
    if (!valid) return "Something's wrong with one of the movies, try removing it.";
    ids.add(movie.id);
  }
  return null;
}

export async function saveList(listId: number, draft: ListDraft): Promise<Result> {
  if (!Number.isInteger(listId)) return { error: "Unknown list." };
  const problem = validateDraft(draft);
  if (problem) return { error: problem };

  const { supabase, userId } = await getSignedInUserId();
  if (!userId) return { error: "Sign in first." };

  // The database function checks the list is this user's draft
  const { error } = await supabase.rpc("save_user_list", {
    p_list_id: listId,
    p_title: draft.title.trim(),
    p_genre_ids: draft.genreIds,
    p_movies: draft.movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path ?? null,
      release_date: movie.release_date ?? null,
      vote_average: typeof movie.vote_average === "number" ? movie.vote_average : null,
    })),
  });
  if (error?.code === "42501") return { error: "This list is already published, it can't change." };
  if (error) return { error: "Couldn't save your list, try again." };
  return {};
}

// Locks the list and puts it on /lists. A first list's promoted days start now
export async function publishList(listId: number): Promise<Result> {
  if (!Number.isInteger(listId)) return { error: "Unknown list." };
  const { userId } = await getSignedInUserId();
  if (!userId) return { error: "Sign in first." };

  const admin = createAdminClient();
  const { data: list } = await admin
    .from("user_lists")
    .select("user_id, status, title, promo_days_owed")
    .eq("id", listId)
    .maybeSingle();
  if (!list || list.user_id !== userId) return { error: "Unknown list." };
  if (list.status !== "draft") return { error: "This list is already published." };
  if (!list.title?.trim()) return { error: "Give your list a title first." };

  const { count } = await admin
    .from("user_list_movies")
    .select("tmdb_id", { count: "exact", head: true })
    .eq("list_id", listId);
  if (count !== LIST_SIZE) return { error: `Add ${LIST_SIZE} movies before publishing.` };

  // Only flips a draft, so publishing twice at once can't book the promotion twice
  const { data: published } = await admin
    .from("user_lists")
    .update({ status: "published", published_at: new Date().toISOString(), promo_days_owed: 0 })
    .eq("id", listId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (!published) return { error: "This list is already published." };

  if (list.promo_days_owed > 0) {
    const { data: payment } = await admin
      .from("list_payments")
      .select("id")
      .eq("list_id", listId)
      .eq("kind", "first_list")
      .maybeSingle();
    const { error } = await admin.rpc("book_promotion", {
      p_list_id: listId,
      p_days: list.promo_days_owed,
      p_payment_id: payment?.id ?? null,
    });
    // The list is live either way. Put the days back so they can be booked by hand
    if (error) {
      await admin
        .from("user_lists")
        .update({ promo_days_owed: list.promo_days_owed })
        .eq("id", listId);
    }
  }

  updateTag(USER_LISTS_TAG);
  redirect(`/lists/${listId}`);
}

// Sends the fan to Stripe to promote one of their published lists
export async function promoteList(listId: number): Promise<Result> {
  if (!LIST_SALES_OPEN) return { error: "Promoting a list is coming soon." };
  if (!Number.isInteger(listId)) return { error: "Unknown list." };
  const { userId, email } = await getSignedInUserId();
  if (!userId) return { error: "Sign in first." };

  const { data: list } = await createAdminClient()
    .from("user_lists")
    .select("user_id, status, title")
    .eq("id", listId)
    .maybeSingle();
  if (!list || list.user_id !== userId) return { error: "Unknown list." };
  if (list.status !== "published") return { error: "Only published lists can be promoted." };

  let url: string;
  try {
    url = await createCheckoutSession({
      kind: "promote",
      userId,
      email,
      listId,
      amountCents: PROMOTE_OFFER.amountCents,
      name: `Promote “${list.title}” for ${PROMOTE_OFFER.days} days`,
      description: "A promoted spot at the top of The Lists on Nicks House of Horrors",
      cancelPath: `/lists/${listId}/promote`,
    });
  } catch (error) {
    console.error("Couldn't start a promotion checkout:", error);
    return { error: "Couldn't start the payment, try again." };
  }
  redirect(url);
}
