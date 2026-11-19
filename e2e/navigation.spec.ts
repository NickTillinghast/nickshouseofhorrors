import { expect, test } from "@playwright/test";
import { isPhone, open } from "./helpers";

test("the navbar links work on desktop", async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo), "phones use the menu button, tested below");
  await open(page, "/home");

  const nav = page.getByRole("navigation").first();
  await nav.getByRole("link", { name: "Blood Bathroom" }).click();
  await expect(page).toHaveURL(/\/blood-bathroom$/);
  await expect(page.getByRole("heading", { level: 1, name: "Who Would Win?" })).toBeVisible();

  await nav.getByRole("link", { name: "Quiz" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Horror Trivia" })).toBeVisible();
});

test("the menu button opens the links on phones", async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo), "desktop shows the links in the navbar");
  await open(page, "/home");

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();

  await menu.getByRole("link", { name: "The Lists" }).click();
  await expect(page).toHaveURL(/\/lists$/);
  await expect(page.getByRole("heading", { level: 1, name: "The Lists" })).toBeVisible();
  // The menu closes itself after picking a page
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});
