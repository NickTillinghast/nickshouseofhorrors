import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { fulfillCheckoutSession, revokePayment, stripe } from "@lib/stripe";
import { USER_LISTS_TAG } from "@lib/userLists";

// Stripe calls this after payments, refunds and disputes. Set up in the Stripe dashboard
// (Developers → Webhooks) with these events, see docs/payments.md:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   charge.refunded, charge.dispute.created
// It reaches the site through CloudFront like any visitor, so src/proxy.ts lets it in

function paymentIntentId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Not configured", { status: 400 });

  // The signature covers the exact bytes Stripe sent, so read the raw body, not JSON
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // An error here returns 500 and Stripe tries again later (for up to 3 days)
  let changed = false;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const result = await fulfillCheckoutSession(event.data.object);
      changed = result.status === "done";
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      // Only a full refund pulls the list. A partial refund is a goodwill gesture
      const id = paymentIntentId(charge.payment_intent);
      if (charge.refunded && id) changed = await revokePayment(id);
      break;
    }
    case "charge.dispute.created": {
      const id = paymentIntentId(event.data.object.payment_intent);
      if (id) changed = await revokePayment(id);
      break;
    }
  }

  // Promotions and hidden lists change /lists. ("max": the next visitor gets the new version
  // soon after; updateTag only works in Server Actions)
  if (changed) revalidateTag(USER_LISTS_TAG, "max");

  return Response.json({ received: true });
}
