# TODO

## When the domain is live

Sign-in redirects are built from `NEXT_PUBLIC_SITE_URL` (`src/lib/site.ts`), so that's the only setting in code. Everything else is a dashboard setting. Replace `<domain>` with `nickshouseofhorrors.com`.

### Supabase (Authentication → URL Configuration)

- [ ] Change **Site URL** from `http://localhost:3000` to `https://<domain>`
- [ ] Add `https://<domain>/auth/callback` to **Redirect URLs**. Keep the localhost one for local development.
- [ ] If there's a `www` version, add `https://www.<domain>/auth/callback` too

### Google Cloud Console (APIs & Services)

- [ ] Credentials → OAuth client → add `https://<domain>` to **Authorized JavaScript origins**
- [ ] Leave **Authorized redirect URIs** alone. It points at Supabase (`https://<project>.supabase.co/auth/v1/callback`), not the domain.
- [ ] OAuth consent screen → add the domain under **Authorized domains**, plus home page and privacy policy links
- [ ] OAuth consent screen → **Publish app**. Until then only the listed test users can sign in with Google.

### Email (magic links)

- [ ] Set up a custom SMTP sender in Supabase (Authentication → Emails → SMTP), e.g. Resend's free tier. The built-in sender only sends a few emails per hour.
- [ ] Send from an address on the domain (e.g. `noreply@<domain>`) and add the SPF/DKIM DNS records the provider gives you, so emails don't land in spam

### Hosting (AWS)

The site runs on AWS: Lambda + CloudFront, set up as CloudFormation in `infra/`. Every push to `main` deploys it. [infra/README.md](infra/README.md) has the full setup.

- [ ] Work through the one-time setup in `infra/README.md`. That's the AWS CLI, the bootstrap stack, moving the Wix nameservers to Route 53, the certificate, a $5 budget alert, and the GitHub secrets and variables.
- [ ] Amazon affiliate links: `/gear` already shows the required disclosure. Any affiliate link added elsewhere needs it too (or move it into the footer)
- [ ] After deploying, test Google sign-in, magic link, hearting, comments, publishing a list and My Movies on the live site
- [ ] Later: AWS "Lambda Web Functions" (launched October 2026) can run Next.js without the Lambda Web Adapter. Worth a look once CloudFormation supports them.

### Search engines

- [ ] Google Search Console: add the domain (verify with a DNS TXT record), then submit `https://<domain>/sitemap.xml`
- [ ] Bing Webmaster Tools: import the site from Search Console (also covers DuckDuckGo and Yahoo)
- [ ] Check `https://<domain>/robots.txt` and `/sitemap.xml` show the real domain, not localhost
- [ ] Run a movie page (e.g. `/movies/694`) through Google's Rich Results Test to confirm the `Movie` structured data
- [ ] Paste a movie link into Slack or iMessage to check the share preview shows the poster
- [ ] Run PageSpeed Insights on `/` and a movie page
- [ ] Remove `robots: { index: false }` from `/about` once it has real content, and add it back to `src/app/sitemap.ts`

## Real payments for Top 10 lists

The list checkout is fake right now (`provider: 'fake'`). To take real money:

- [ ] Create a Stripe account and add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local` and the host
- [ ] Replace `buyList` and `promoteList` in `src/app/(pages)/lists/actions.ts` with Stripe Checkout redirects, and swap `FakeCheckout` for a "Continue to payment" button
- [ ] Add `src/app/api/stripe/webhook/route.ts` that calls `completePurchase` (`src/lib/listPurchases.ts`) with `provider: 'stripe'` once Stripe confirms the payment
- [ ] Check the prices in `src/lib/userLists.ts`
- [ ] Clear out test lists and payments made with the fake checkout
