import { expect, test } from "@playwright/test";
import { expectNoSidewaysScroll, open, watchForErrors } from "./helpers";

// Every main page loads, shows its heading, has no browser errors,
// and fits the screen without scrolling sideways (desktop, Android and iPhone)
const PAGES = [
  { path: "/home", heading: "Nicks House of Horrors" },
  { path: "/movies", heading: "Horror Movies" },
  { path: "/movies?subgenre=1299", heading: "Monster Movies" },
  { path: "/quiz", heading: "Horror Trivia" },
  { path: "/lists", heading: "The Lists" },
  { path: "/blood-bathroom", heading: "Who Would Win?" },
  { path: "/gear", heading: "Horror Gear" },
  { path: "/about", heading: "Welcome to the House" },
  { path: "/movies/694", heading: /The Shining/ },
];

for (const { path, heading } of PAGES) {
  test(`${path} loads and fits the screen`, async ({ page }) => {
    const errors = watchForErrors(page);
    await open(page, path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expectNoSidewaysScroll(page);
    expect(errors, "browser errors").toEqual([]);
  });
}

test("/ sends visitors to /home", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);
});

test("health check answers", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
});

test("an unknown page shows not found", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
});
