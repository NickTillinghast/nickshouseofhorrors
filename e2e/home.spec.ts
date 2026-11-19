import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

function reelTitles(page: Page) {
  return page
    .getByRole("list", { name: "Reel of horror movies" })
    .locator("li p")
    .allTextContents();
}

test("changing the reel's genre loads different movies", async ({ page }) => {
  await open(page, "/home");
  const before = await reelTitles(page);
  expect(before.length).toBeGreaterThan(1);

  await page.getByRole("button", { name: /^Genre/ }).click();
  await page.getByRole("option", { name: "Zombie", exact: true }).click();

  // The dropdown only switches once the new movies are on the reel
  await expect(page.getByRole("button", { name: /^Genre Zombie/ })).toBeVisible();
  await expect.poll(() => reelTitles(page)).not.toEqual(before);
});

test("spinning the reel picks a movie", async ({ page }) => {
  await open(page, "/home");
  await page.getByRole("button", { name: "Spin", exact: true }).click();
  await expect(page.getByText(/^The reel picked /)).toBeAttached({ timeout: 20_000 });
});

test("the home page shows the newest battle", async ({ page }) => {
  await open(page, "/home");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Who would win?" }),
  });
  await expect(section.getByRole("button", { name: /^Vote for / })).toHaveCount(2);

  await section.getByRole("link", { name: /More battles in the Blood Bathroom/ }).click();
  await expect(page).toHaveURL(/\/blood-bathroom$/);
});
