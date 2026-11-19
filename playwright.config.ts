import { release } from "node:os";
import { defineConfig, devices } from "@playwright/test";

// Browser tests: they open the real site in a real browser and click through it. See e2e/README.md
//
//   npm run test:e2e                     builds the site, starts it on port 3100, runs every test
//   npm run test:e2e -- --ui             same, in Playwright's window where you can watch each step
//   E2E_BASE_URL=https://nickshouseofhorrors.com npm run test:e2e    tests the live site instead
//
// Tests only look and click, they never save anything: the site has one Supabase database
// and it's the live one

const PORT = 3100;
const externalSite = process.env.E2E_BASE_URL;

// Playwright has no browsers of its own for macOS 13 (Ventura), so on such a Mac the tests
// use the installed Google Chrome, iPhone included (Chrome at iPhone size).
// GitHub's Linux machines use Playwright's browsers, with real WebKit (Safari) for the iPhone
const oldMac = process.platform === "darwin" && Number(release().split(".")[0]) < 23;
const chrome = oldMac ? { channel: "chrome" } : {};
const iphone = oldMac
  ? { ...devices["iPhone 13"], defaultBrowserType: "chromium" as const, ...chrome }
  : devices["iPhone 13"];

export default defineConfig({
  testDir: "./e2e",
  // A test fails on TMDB or Supabase being slow now and then, so give it one more go in CI
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  // GitHub's machines have 4 cores; locally Playwright picks for you
  workers: process.env.CI ? 4 : undefined,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html"]],
  use: {
    baseURL: externalSite ?? `http://127.0.0.1:${PORT}`,
    // A screenshot and a step-by-step trace of any failed test, viewable in the report
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...chrome } },
    // A small Android screen (360 wide), the narrowest the site is built for
    { name: "android", use: { ...devices["Galaxy S8"], ...chrome } },
    { name: "iphone", use: iphone },
  ],
  // The same standalone server AWS runs, built fresh. Skipped when testing an outside site
  webServer: externalSite
    ? undefined
    : {
        command: "npm run build && npm run start:standalone",
        url: `http://127.0.0.1:${PORT}/api/health`,
        env: { PORT: String(PORT), HOSTNAME: "127.0.0.1" },
        // Locally, a server you already started on 3100 is reused instead of building again
        reuseExistingServer: !process.env.CI,
        timeout: 5 * 60_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
