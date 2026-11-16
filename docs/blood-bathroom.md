# Blood Bathroom: adding a battle

The Blood Bathroom (`/blood-bathroom`, heading "Who Would Win?") lists every battle, newest first. The newest one also shows on the home page above the spinner reel. Battles are added in the Supabase dashboard, there's no admin page on the site.

Fighters and battles are separate, so a fighter is added once and can be in any number of battles.

## 1. Add the fighter images

Each fighter is its own image, like the pixel art in `public/assets/fighters/`:

- Square, ideally **256 × 256 PNG** with a transparent background
- Named after the fighter, lowercase with dashes: `freddy-krueger.png`
- Facing forward or toward the middle looks best (the left fighter is shown on the left)

Put the file in `public/assets/fighters/`, then commit and push so it's on the live site.

> Skip this step for fighters that are already in a battle. Check the `battle_fighters` table.

## 2. Add the fighters in Supabase

Supabase → **Table Editor** → `battle_fighters` → **Insert row**:

| Column  | What to put                                                        |
| ------- | ------------------------------------------------------------------ |
| `name`  | The fighter's full name, e.g. `Freddy Krueger`                     |
| `image` | The path from `public`, e.g. `/assets/fighters/freddy-krueger.png` |

Leave `id` and `created_at` empty, they fill themselves in. Note each fighter's `id` after saving.

## 3. Add the battle

Supabase → **Table Editor** → `battles` → **Insert row**:

| Column             | What to put                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `left_fighter_id`  | The `id` of the fighter on the left                                           |
| `right_fighter_id` | The `id` of the fighter on the right                                          |
| `tagline`          | Optional, a line under the names, e.g. `Elm Street vs Camp Crystal Lake`      |
| `slug`             | **Leave empty.** It's made from the names: `freddy-krueger-vs-jason-voorhees` |

Leave `id`, `status` (`published`) and `published_at` (now) as they are.

## 4. Check it

It shows on the site within a few minutes (the battle list is cached briefly):

- `https://nickshouseofhorrors.com/blood-bathroom`, at the top
- The home page, above the spinner reel
- Its own page, `https://nickshouseofhorrors.com/blood-bathroom/<slug>`, which is also added to the sitemap for Google

## Changing things later

- **Hide a battle:** set its `status` to `hidden`. Its votes and comments are kept, set it back to `published` to bring it back.
- **Move a battle to the top:** set its `published_at` to now.
- **Fix a fighter's name or image:** edit the `battle_fighters` row. It changes in every battle they're in.
- **Change a battle's page address:** edit `slug` (lowercase letters, numbers and dashes). Old links to the previous address stop working, so do it before sharing.
- **Votes** are in `battle_votes`, one row per person per battle. Don't edit them by hand.
- **Comments** are in `comments`, with `thread` set to `battle:<battle id>`. Matchup suggestions from the top of the page are under `battle:suggestions`.

## Later: images without a push

Fighter images can live in Supabase Storage instead of the repo, so a new fighter doesn't need a deploy:

1. Supabase → **Storage** → create a **public** bucket called `fighters` (once).
2. Upload the image, then copy its public URL.
3. Paste that full URL (`https://<project>.supabase.co/storage/v1/object/public/fighters/freddy-krueger.png`) into the fighter's `image` column.

## How it works

- Tables, permissions and the vote count function: `supabase/migrations/006_battles.sql`
- Reading battles: `src/lib/battles.ts`
- The battle card, voting and comments: `src/components/Battle/`
- Pages: `src/app/(pages)/blood-bathroom/`
