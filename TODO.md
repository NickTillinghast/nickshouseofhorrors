# TODO

## When the domain is live

Sign-in redirects are built from the current site address, so the code only needs one setting: `NEXT_PUBLIC_SITE_URL` (see Hosting). Everything else is a dashboard setting. Replace `<domain>` with the real domain, e.g. `nickshouseofhorrors.com`.

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

### Hosting

- [ ] Add every variable from `.env.local` to the host's environment settings: `TMDB_API_KEY`, `WHERE_TO_WATCH_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (quiz leaderboard; keep it secret, never prefix it with `NEXT_PUBLIC_`)
- [ ] Add `NEXT_PUBLIC_SITE_URL=https://<domain>` (no trailing slash). Canonical links, the sitemap, `robots.txt` and share previews all use it, and they fall back to `http://localhost:3000` without it (`src/lib/site.ts`)
- [ ] Amazon affiliate links: `/gear` already shows the required disclosure. Any affiliate link added elsewhere needs it too (or move it into the footer)
- [ ] After deploying, test Google sign-in, magic link, hearting and My Movies on the live site

### Search engines

- [ ] Google Search Console: add the domain (verify with a DNS TXT record), then submit `https://<domain>/sitemap.xml`
- [ ] Bing Webmaster Tools: import the site from Search Console (also covers DuckDuckGo and Yahoo)
- [ ] Check `https://<domain>/robots.txt` and `/sitemap.xml` show the real domain, not localhost
- [ ] Run a movie page (e.g. `/movies/694`) through Google's Rich Results Test to confirm the `Movie` structured data
- [ ] Paste a movie link into Slack or iMessage to check the share preview shows the poster
- [ ] Run PageSpeed Insights on `/` and a movie page
- [ ] Remove `robots: { index: false }` from `/lists` once the lists have movies in them, and add it to `src/app/sitemap.ts`
- [ ] Remove `robots: { index: false }` from `/about` once it has real content, and add it back to `src/app/sitemap.ts`
