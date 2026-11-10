import "server-only";
import { createAdminClient } from "./supabase/admin";
import {
  EXTRA_LIST_PRICE_CENTS,
  FIRST_LIST_PRICE_CENTS,
  FIRST_LIST_PROMO_DAYS,
  PROMOTE_DAYS,
  PROMOTE_PRICE_CENTS,
  type ListKind,
} from "./userLists";

// Everything here runs with the secret key, so callers must check who's signed in first

// A fan's first list costs more and comes with promoted days, every list after that is cheaper
export async function getListOffer(userId: string) {
  const { count } = await createAdminClient()
    .from("list_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", ["first_list", "extra_list"]);

  const kind: ListKind = count ? "extra_list" : "first_list";
  return {
    kind,
    amountCents: kind === "first_list" ? FIRST_LIST_PRICE_CENTS : EXTRA_LIST_PRICE_CENTS,
    promoDays: kind === "first_list" ? FIRST_LIST_PROMO_DAYS : 0,
  };
}

// When a promotion bought now would run, without booking it
export async function previewPromotion(listId: number, days: number) {
  const { data } = await createAdminClient()
    .rpc("next_promotion_slot", { p_list_id: listId })
    .single<{ lane: number; starts_at: string }>();
  const now = Date.now();
  const startsAt = data?.starts_at ?? new Date(now).toISOString();
  const endsAt = new Date(new Date(startsAt).getTime() + days * 86_400_000).toISOString();
  // A spot is free right now, nothing to wait for
  const startsNow = new Date(startsAt).getTime() - now < 60_000;
  return { startsAt, endsAt, startsNow };
}

type Purchase =
  | { kind: ListKind; userId: string; amountCents: number; provider: string; providerRef?: string }
  | {
      kind: "promote_30";
      userId: string;
      listId: number;
      amountCents: number;
      provider: string;
      providerRef?: string;
    };

// Runs once a payment has gone through. The fake checkout calls it today,
// a Stripe webhook will call it later with provider "stripe"
export async function completePurchase(purchase: Purchase): Promise<{ listId: number }> {
  const admin = createAdminClient();

  let listId: number;
  if (purchase.kind === "promote_30") {
    listId = purchase.listId;
  } else {
    // A new paid draft. A first list's promoted days wait until it's published
    const { data: list, error } = await admin
      .from("user_lists")
      .insert({
        user_id: purchase.userId,
        promo_days_owed: purchase.kind === "first_list" ? FIRST_LIST_PROMO_DAYS : 0,
      })
      .select("id")
      .single();
    if (error || !list) throw new Error("Couldn't create the list");
    listId = list.id;
  }

  const { data: payment, error: paymentError } = await admin
    .from("list_payments")
    .insert({
      list_id: listId,
      user_id: purchase.userId,
      kind: purchase.kind,
      amount_cents: purchase.amountCents,
      provider: purchase.provider,
      provider_ref: purchase.providerRef ?? null,
    })
    .select("id")
    .single();
  if (paymentError || !payment) {
    // Don't leave an unpaid list behind
    if (purchase.kind !== "promote_30") await admin.from("user_lists").delete().eq("id", listId);
    throw new Error("Couldn't record the payment");
  }

  if (purchase.kind === "promote_30") {
    const { error } = await admin.rpc("book_promotion", {
      p_list_id: listId,
      p_days: PROMOTE_DAYS,
      p_payment_id: payment.id,
    });
    if (error) throw new Error("Couldn't book the promotion");
  }

  return { listId };
}

export const PROMOTE_OFFER = { amountCents: PROMOTE_PRICE_CENTS, days: PROMOTE_DAYS };
