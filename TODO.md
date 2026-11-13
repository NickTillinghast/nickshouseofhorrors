# TODO

## Live site setup

The site is live at https://nickshouseofhorrors.com on AWS (Lambda + CloudFront, CloudFormation in `infra/`). Every push to `main` deploys it, see [infra/README.md](infra/README.md).

### Hosting (AWS)

- [x] One-time setup from `infra/README.md`: AWS CLI, bootstrap stack, Wix nameservers moved to Route 53, certificate, GitHub secrets and variables
- [x] Each deploy clears CloudFront's cache, so static pages never serve an old version
- [x] **$5 budget alert** set up (Billing → Budgets). The site bills per request, this is the early warning for bot floods
- [ ] Optional: the first visit after the site has been idle takes ~2–5 s while Lambda starts. Raising `MemorySize` in `infra/app.yml` from 1024 to 2048 usually shortens that, for a few cents a month
- [ ] Later: AWS "Lambda Web Functions" (launched October 2026) can run Next.js without the Lambda Web Adapter. Worth a look once CloudFormation supports them.

### Supabase (Authentication → URL Configuration)

- [x] **Site URL**: `https://nickshouseofhorrors.com`
- [x] **Redirect URLs**: add `https://nickshouseofhorrors.com/auth/callback`, keep the localhost one for local development. (No `www` one needed, CloudFront redirects `www` before it reaches the site.)

### Google Cloud Console (APIs & Services)

- [ ] Credentials → OAuth client → add `https://nickshouseofhorrors.com` to **Authorized JavaScript origins**
- [ ] Leave **Authorized redirect URIs** alone. It points at Supabase (`https://<project>.supabase.co/auth/v1/callback`), not the domain.
- [ ] OAuth consent screen → add `nickshouseofhorrors.com` under **Authorized domains**, plus home page (`/home`) and privacy policy links
- [ ] OAuth consent screen → **Publish app**. Until then only the listed test users can sign in with Google.

### Test on the live site

- [ ] Google sign-in and a magic link
- [ ] Heart a movie, My Movies, comments, saving a quiz score
- [ ] Buy a list with the fake checkout and publish it, then check it shows on `/lists` in another browser right away (proves the shared cache works across Lambda copies)
- [ ] Hide or delete leftover test lists in Supabase (`user_lists.status = 'hidden'`), e.g. the promoted "Ultimate Top 10" by fauxhammer

### Email (magic links)

- [ ] Set up a custom SMTP sender in Supabase (Authentication → Emails → SMTP), e.g. Resend's free tier. The built-in sender only sends a few emails per hour.
- [ ] Send from an address on the domain (e.g. `noreply@nickshouseofhorrors.com`). Add the SPF/DKIM records the provider gives you to `infra/dns-zone.yml` (next to the Google TXT record) so emails don't land in spam

### Search engines

- [x] DNS TXT record for Google Search Console (`infra/dns-zone.yml`)
- [x] `robots.txt` and `sitemap.xml` use the real domain
- [x] Subgenre pages, site and list structured data, keywords, real favicon and Apple touch icon
- [x] Google Search Console: domain verified
- [ ] Google Search Console → Sitemaps: submit `https://nickshouseofhorrors.com/sitemap.xml`
- [ ] Bing Webmaster Tools: import the site from Search Console (also covers DuckDuckGo and Yahoo)
- [ ] Run a movie page (e.g. `/movies/694`) and a fan list (`/lists/<id>`) through Google's Rich Results Test
- [ ] Paste a movie link and `/about` into iMessage to check the share previews
- [ ] Run PageSpeed Insights on `/home` and a movie page

### Other

- [ ] Amazon affiliate links: `/gear` already shows the required disclosure. Any affiliate link added elsewhere needs it too (or move it into the footer)

## Real payments for Top 10 lists

The list checkout is fake right now (`provider: 'fake'`). Stripe Checkout is the plan, about a day of work. To take real money:

- [ ] Decide prices. Stripe takes 2.9% + 30¢, so the $2 extra list keeps ~$1.64 (consider $2.99, or a bundle)
- [ ] Decide on sales tax (Stripe Tax, ~0.5%) and a refund policy
- [ ] Add Terms, Privacy Policy and Refund policy pages (Stripe expects them)
- [ ] Create a Stripe account; add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local`, the GitHub secrets, and `infra/app.yml`
- [ ] Replace `buyList` and `promoteList` in `src/app/(pages)/lists/actions.ts` with Stripe Checkout redirects, and swap `FakeCheckout` for a "Continue to payment" button
- [ ] Add `src/app/api/stripe/webhook/route.ts` that calls `completePurchase` (`src/lib/listPurchases.ts`) with `provider: 'stripe'` once Stripe confirms the payment, plus refund/dispute handling
- [ ] Prices live in `src/lib/userListShared.ts`
- [ ] Clear out test lists and payments made with the fake checkout
