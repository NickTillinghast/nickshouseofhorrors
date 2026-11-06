# TODO

## When the domain is live

The code builds sign-in redirects from the current site address, so nothing in `src/` needs to change. These are all dashboard settings. Replace `<domain>` with the real domain, e.g. `nickshouseofhorrors.com`.

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

- [ ] Add every variable from `.env.local` to the host's environment settings: `TMDB_API_KEY`, `WHERE_TO_WATCH_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] After deploying, test Google sign-in, magic link, hearting and My Hearts on the live site
