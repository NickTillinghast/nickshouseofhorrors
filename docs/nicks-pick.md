# Nick's picks: the featured movies on the home page

Your two newest picks, side by side right under the logo on `/home` (stacked on phones). Each is the same card as the top rated movies on `/movies`, labeled **Nick's pick**, with its own heading above it (e.g. "Best Cheesy Gore"). Picks are added in the Supabase dashboard; there's no admin page on the site.

With one published pick it shows on its own, centered. With none, the section stays hidden.

## One-time setup

Run `supabase/migrations/008_nicks_picks.sql` in Supabase → **SQL Editor**.

## Adding a pick

1. **Find the movie's TMDB id.** It's the number in the movie's address, either on this site or on TMDB:
   - `nickshouseofhorrors.com/movies/694` → `694`
   - `themoviedb.org/movie/694-the-shining` → `694`
2. Supabase → **Table Editor** → `nicks_picks` → **Insert row**:

| Column    | What to put                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| `tmdb_id` | The number from step 1, e.g. `694`                                            |
| `heading` | The line above the card, up to 60 characters, e.g. `Comedy of Terrors`        |
| `note`    | Optional: a line under the heading, up to 280 characters. Leave empty to skip |

Leave `id`, `status` and `published_at` alone; they fill themselves in.

It shows on the home page within a few minutes. The **two newest** published picks are shown (newest on the left), so a third pick bumps the oldest one off. Old rows stay as a history.

To show more or fewer than two, change `NICKS_PICKS_SHOWN` in `src/lib/nicksPick.ts`.

## Changing or removing

- **Fix a heading or note:** edit the row.
- **Take a pick down:** set its `status` to `hidden`. The next newest pick takes its place; hide them all and the section disappears.
- **Bring an old pick back:** set its `published_at` to now.

If a pick doesn't show, check its `tmdb_id`. A number TMDB doesn't know skips that pick instead of breaking the page, and the error shows in the CloudWatch logs.

## Heading ideas

Best Cheesy Gore · Comedy of Terrors · So Bad It's Good · Best Practical Effects · Midnight Movie · Don't Watch Alone · Gateway Horror · Ending You Won't Forget
