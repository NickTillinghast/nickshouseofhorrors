# Payments: Top 10 lists with Stripe

Fans pay on **Stripe Checkout** (Stripe's own payment page). Card details never touch this site.

| What                     | Price | Fan gets                                           |
| ------------------------ | ----- | -------------------------------------------------- |
| First Top 10 list        | $4.99 | A list, promoted for 14 days once it's published   |
| Each list after that     | $2.99 | A list                                             |
| Promote a published list | $4.99 | 14 days in one of the two promoted spots on /lists |

Prices and day counts live in `src/lib/userListShared.ts`. Change them there and every page, the checkout and the Terms update.

## How a purchase works

1. **"Continue to payment"** on `/lists/new/checkout` (or a list's promote page). The server checks they're signed in with a username, works out the price, and sends them to Stripe.
2. **They pay on Stripe's page.** Promo codes are entered there. "Back" returns them to the checkout page with "Payment canceled, you weren't charged".
3. **The purchase is recorded** by whichever arrives first, and only once:
   - **Stripe's webhook** (`/api/stripe/webhook`), even if they close the tab
   - **the success page** Stripe sends them back to (`/lists/checkout/success`)
4. **They land on the list builder** (new list) or **My lists** (promotion).

Code: `src/lib/stripe.ts` (checkout, recording, refunds), `src/app/api/stripe/webhook/route.ts`, `src/app/(pages)/lists/actions.ts` (`buyList`, `promoteList`), `src/lib/listPurchases.ts` (`completePurchase`).

## Switching sales on and off

`LIST_SALES_OPEN` in `src/lib/userListShared.ts`. While `false`, the checkout pages say "coming soon" and the server refuses to start a payment. Webhooks for payments already made still work.

## Testing (test mode, no real money)

1. In `src/lib/userListShared.ts`, set `LIST_SALES_OPEN = true` **on your computer only**. Don't push it until you go live.
2. `npm run dev`, sign in, open **The Lists → Create your Top 10 → Continue to payment**.
3. On Stripe's page, use test card `4242 4242 4242 4242`, any future date, any CVC, any ZIP.
4. You should land on the list builder. Publish the list and it shows promoted on `/lists`.

Other test cards: `4000 0000 0000 0002` is declined, `4000 0025 0000 3155` asks for 3D Secure. More at https://docs.stripe.com/testing.

Locally the success page records the purchase (Stripe can't reach your computer's webhook). That's expected and is why both paths exist.

## Promo codes

Stripe dashboard → **Product catalog → Coupons → Create coupon** (e.g. 50% off, or 100% off), then **Add promotion code** (the code fans type, e.g. `FOUNDERS`). You can limit how many times it's used and when it expires. A 100%-off code still creates the list, recorded as $0.

## Refunds and disputes

Refund from the Stripe dashboard (**Payments** → the payment → **Refund**). The webhook then:

- **List purchase refunded:** hides the list (status `hidden`) and removes its promotion
- **Promotion refunded:** removes that promotion from the queue
- **Disputed (chargeback):** same as a refund

Only a **full** refund pulls the list; a partial refund leaves it up. The policy fans see is at `/refunds`.

## Webhook

Stripe dashboard → **Developers → Webhooks**, endpoint `https://nickshouseofhorrors.com/api/stripe/webhook`, with these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`

Its **signing secret** (`whsec_…`) is `STRIPE_WEBHOOK_SECRET`. If a delivery fails, Stripe retries for 3 days, and you can resend any event from the dashboard (the site never records the same payment twice).

## Secrets

| Name                    | Where                                                  |
| ----------------------- | ------------------------------------------------------ |
| `STRIPE_SECRET_KEY`     | `.env.local`, GitHub secret → Lambda (`infra/app.yml`) |
| `STRIPE_WEBHOOK_SECRET` | `.env.local`, GitHub secret → Lambda (`infra/app.yml`) |

Test keys start `sk_test_`. Live keys start `sk_live_`, and live mode has its **own** webhook with its own signing secret.

## Going live

1. Finish activating the Stripe account (business details, bank account, statement descriptor like `NICKSHOUSEOFHORRORS`).
2. In live mode, add the same webhook (same URL and 4 events) and copy its new signing secret.
3. Replace both GitHub secrets with the live key and the live signing secret.
4. Set `LIST_SALES_OPEN = true` and push.
5. Buy one list yourself with a real card, then refund it from the dashboard to check refunds pull the list.

## Sales tax

Off (`STRIPE_TAX_ENABLED` in `src/lib/stripe.ts`). Colorado has no sales threshold for in-state sellers, but whether a paid list slot counts as a taxable digital good is unclear. Check with the Colorado Department of Revenue or a CPA. If it's taxable: get a Colorado sales tax license, set up Stripe Tax in the dashboard, then turn the switch on.
