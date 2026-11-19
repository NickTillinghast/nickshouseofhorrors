import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("battles show with standings and comments", async ({ page }) => {
  await open(page, "/blood-bathroom");

  const battles = page.locator("main ol > li article");
  expect(await battles.count()).toBeGreaterThan(0);

  const first = battles.first();
  await expect(first.getByRole("button", { name: /^Vote for / })).toHaveCount(2);
  // The standings load in the browser: either the percentages or "No votes yet"
  await expect(first.getByText(/votes?\b|No votes yet/).first()).toBeVisible();
  await expect(first.getByText("Make your case")).toBeVisible();
});

test("voting while signed out asks you to sign in", async ({ page }) => {
  await open(page, "/blood-bathroom");
  await page
    .locator("main ol > li article")
    .first()
    .getByRole("button", { name: /^Vote for / })
    .first()
    .click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("a battle has its own page", async ({ page }) => {
  await open(page, "/blood-bathroom");
  const title = page.locator("main ol > li article h2 a").first();
  const name = (await title.textContent())?.trim() ?? "";
  await title.click();

  await expect(page).toHaveURL(/\/blood-bathroom\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});
