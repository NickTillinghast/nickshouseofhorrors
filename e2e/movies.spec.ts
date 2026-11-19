import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("the subgenre filter switches the movies", async ({ page }) => {
  await open(page, "/movies");
  // A few classics (Psycho) top several lists, so compare the whole set of titles
  const titles = () => page.locator("main h2").allTextContents();
  const before = await titles();

  await page.getByRole("button", { name: /^Filter/ }).click();
  await page.getByRole("option", { name: "Slasher", exact: true }).click();

  await expect(page).toHaveURL(/subgenre=12339/);
  await expect(page.getByRole("heading", { level: 1, name: "Slasher Movies" })).toBeVisible();
  await expect.poll(titles).not.toEqual(before);
});

test("a movie card opens its popup, then its comments", async ({ page }) => {
  await open(page, "/movies");

  const title = page.locator("main h2 a").first();
  const name = (await title.textContent())?.trim() ?? "";
  await title.click();

  // A popup on top of the page, not a trip to the movie's own page
  const details = page.getByRole("dialog", { name });
  await expect(details).toBeVisible();
  await expect(page).toHaveURL(/\/movies(\?|$)/);
  await expect(details.getByRole("heading", { name: new RegExp(escape(name)) })).toBeVisible();

  // The comment bubble switches the popup to its comments
  await details.getByRole("button", { name: /^Open .*comments? for/ }).click();
  const comments = page.getByRole("dialog", { name: `Comments on ${name}` });
  await expect(comments).toBeVisible();
  await comments.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog", { name })).toBeVisible();

  await page.getByRole("dialog", { name }).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Google only trusts a canonical link inside <head>. Next streams it into the <body> unless
// the visitor is on htmlLimitedBots (next.config.ts), which Googlebot has to stay on
test("Google gets a movie's title and canonical link in the head", async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a request, checked once");
  const response = await request.get("/movies/694", {
    headers: {
      "user-agent":
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130 Safari/537.36",
    },
  });
  expect(response.status()).toBe(200);
  const html = await response.text();
  const head = html.slice(0, html.indexOf("</head>"));
  expect(head).toMatch(/<title>[^<]*The Shining/);
  expect(head).toMatch(/<link rel="canonical" href="[^"]*\/movies\/694"/);
});
