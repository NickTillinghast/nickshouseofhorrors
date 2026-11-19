# Browser tests (Playwright)

These tests open the site in a real browser and click through it like a visitor: pages load, the menu works, the filter and the reel change the movies, popups open, battles show, and nothing scrolls sideways on a phone.

Every test runs three times, once each on:

- **desktop:** Chrome at desktop size
- **android:** Chrome at a small 360px Android size
- **iphone:** Safari's engine (WebKit) at iPhone 13 size

They only look and click, they **never save anything** (no votes, comments or hearts). The site has one Supabase database and it's the live one.

## Running them

```bash
npm run test:e2e                  # builds the site, starts it on port 3100, runs everything (~2-4 min)
npm run test:e2e -- --ui          # same, in a window where you can watch each step
npm run test:e2e -- e2e/battles.spec.ts --project desktop   # one file, one browser
npm run test:e2e:report           # open the last report (screenshots of anything that failed)
```

Test the live site instead of a local build:

```bash
E2E_BASE_URL=https://nickshouseofhorrors.com npm run test:e2e
```

**On this Mac (macOS 13):** Playwright doesn't ship browsers for macOS 13, so the tests use your installed Google Chrome, and the iPhone tests run in Chrome at iPhone size. GitHub runs them in real WebKit.

## On GitHub

Every push to `main` runs them before deploying (the `e2e` job in `.github/workflows/deploy.yml`). If one fails, the site isn't deployed, same as a type error. To see why: Actions tab → the run → **Artifacts** → `playwright-report`, unzip it, then `npx playwright show-report <folder>`.

## Files

| File                 | What it checks                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pages.spec.ts`      | Every main page loads, has its heading, no errors, no sideways scroll                                                                |
| `navigation.spec.ts` | Navbar links on desktop, the menu button on phones                                                                                   |
| `movies.spec.ts`     | The subgenre filter, a card's popup and its comments                                                                                 |
| `home.spec.ts`       | The reel's genre and spin, the newest battle                                                                                         |
| `battles.spec.ts`    | Battles, standings, "sign in to vote", a battle's own page                                                                           |
| `lists.spec.ts`      | "Create your Top 10" (coming soon or sign in to pay, following `LIST_SALES_OPEN`), Nick's list                                       |
| `payments.spec.ts`   | The Stripe webhook refuses unsigned or forged requests, the success page needs a real payment and sign-in, legal links in the footer |
| `helpers.ts`         | Shared steps: open a page, catch browser errors, check sideways scroll                                                               |

**When you change the site:** if a test fails because you changed something on purpose (renamed a page, turned list sales back on), update the test to match.
