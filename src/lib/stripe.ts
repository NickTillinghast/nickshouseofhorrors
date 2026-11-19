import "server-only";
import Stripe from "stripe";
import { AlreadyRecordedError, completePurchase, type Purchase } from "./listPurchases";
import { SITE_URL } from "./site";
import { createAdminClient } from "./supabase/admin";
import type { PurchaseKind } from "./userListShared";

// Payments through Stripe Checkout (Stripe's own payment page). See docs/payments.md
//
// A purchase is recorded from two places, whichever gets there first:
//   - Stripe's webhook (src/app/api/stripe/webhook/route.ts), even if the fan closes the tab
//   - the success page Stripe sends the fan back to (lists/checkout/success), so they never wait
// The unique Stripe session id on list_payments makes sure it's only ever recorded once

// Collect sales tax with Stripe Tax. Off until Nick confirms with the Colorado Department of
// Revenue whether list slots are taxable; turning it on also needs tax set up in Stripe
const STRIPE_TAX_ENABLED = false;

// Pinned, so a Stripe update never changes how payments behave without us choosing to
const API_VERSION = "2026-10-28.endive";

let client: Stripe | null = null;

// Created on first use: the key only exists at runtime, not while the site is being built
export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY isn't set");
    client = new Stripe(key, { apiVersion: API_VERSION });
  }
  return client;
}

type CheckoutRequest = {
  kind: PurchaseKind;
  userId: string;
  email?: string;
  amountCents: number;
  // What the fan sees on Stripe's page and their receipt
  name: string;
  description: string;
  // The list being promoted
  listId?: number;
  // Where "back" on Stripe's page goes, e.g. /lists/new/checkout
  cancelPath: string;
};

// Starts a payment and returns the Stripe page to send the fan to.
// The amount always comes from our server (getListOffer, PROMOTE_PRICE_CENTS), never the browser
export async function createCheckoutSession(request: CheckoutRequest) {
  const metadata = {
    userId: request.userId,
    kind: request.kind,
    listId: request.listId ? String(request.listId) : "",
  };
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: request.amountCents,
          product_data: { name: request.name, description: request.description },
        },
      },
    ],
    client_reference_id: request.userId,
    customer_email: request.email,
    metadata,
    payment_intent_data: { metadata },
    // Codes are made in the Stripe dashboard (Product catalog → Coupons)
    allow_promotion_codes: true,
    automatic_tax: { enabled: STRIPE_TAX_ENABLED },
    success_url: `${SITE_URL}/lists/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${request.cancelPath}?canceled=1`,
  });
  if (!session.url) throw new Error("Stripe didn't return a checkout page");
  return session.url;
}

export type Fulfillment =
  | { status: "done"; kind: PurchaseKind; listId: number }
  // The payment hasn't cleared yet (rare with cards, e.g. a bank delay)
  | { status: "pending" };

async function findRecorded(sessionId: string) {
  const { data } = await createAdminClient()
    .from("list_payments")
    .select("list_id, kind")
    .eq("provider", "stripe")
    .eq("provider_ref", sessionId)
    .maybeSingle();
  if (!data) return null;
  const kind: PurchaseKind = data.kind === "promote_30" ? "promote" : data.kind;
  return { status: "done" as const, kind, listId: data.list_id as number };
}

function readMetadata(session: Stripe.Checkout.Session) {
  const { userId, kind, listId } = session.metadata ?? {};
  if (!userId || !["first_list", "extra_list", "promote"].includes(kind ?? "")) {
    throw new Error(`Checkout session ${session.id} has no purchase details`);
  }
  return { userId, kind: kind as PurchaseKind, listId: listId ? Number(listId) : undefined };
}

// Records a paid checkout: creates the list or books the promotion. Safe to call any number
// of times for the same session, from the webhook and the success page at once
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<Fulfillment> {
  // "no_payment_required" is a 100%-off promo code
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { status: "pending" };
  }

  const recorded = await findRecorded(session.id);
  if (recorded) return recorded;

  const { userId, kind, listId } = readMetadata(session);
  const paid = {
    userId,
    amountCents: session.amount_total ?? 0,
    provider: "stripe",
    providerRef: session.id,
  };
  let purchase: Purchase;
  if (kind === "promote") {
    if (!listId) throw new Error(`Checkout session ${session.id} is a promotion without a list`);
    purchase = { kind, listId, ...paid };
  } else {
    purchase = { kind, ...paid };
  }

  try {
    const { listId: newListId } = await completePurchase(purchase);
    return { status: "done", kind, listId: newListId };
  } catch (error) {
    // The webhook and the success page arrived at the same moment, and the other one won
    if (error instanceof AlreadyRecordedError) {
      const winner = await findRecorded(session.id);
      if (winner) return winner;
    }
    throw error;
  }
}

// A refund or a dispute: pull what was paid for. A refunded list is hidden, a refunded
// promotion is taken out of the queue. Returns whether anything changed
export async function revokePayment(paymentIntentId: string) {
  const sessions = await stripe().checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  const session = sessions.data[0];
  if (!session) return false;

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("list_payments")
    .update({ refunded_at: new Date().toISOString() })
    .eq("provider", "stripe")
    .eq("provider_ref", session.id)
    .is("refunded_at", null)
    .select("id, list_id, kind")
    .maybeSingle();
  if (!payment) return false;

  if (payment.kind === "promote" || payment.kind === "promote_30") {
    await admin.from("list_promotions").delete().eq("payment_id", payment.id);
  } else {
    await admin.from("user_lists").update({ status: "hidden" }).eq("id", payment.list_id);
    await admin.from("list_promotions").delete().eq("list_id", payment.list_id);
  }
  return true;
}
