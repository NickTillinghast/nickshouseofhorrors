import { expect, test } from "@playwright/test";
import { FIRST_LIST_PRICE_CENTS, formatPrice, LIST_SALES_OPEN } from "../src/lib/userListShared";
import { open } from "./helpers";

// Follows the LIST_SALES_OPEN switch in src/lib/userListShared.ts, so it passes either way
test("Create your Top 10 matches whether sales are open", async ({ page }) => {
  await open(page, "/lists");
  const create = page.getByRole("link", { name: /Create your Top 10/ });

  if (LIST_SALES_OPEN) {
    await expect(create).toContainText(formatPrice(FIRST_LIST_PRICE_CENTS));
    await create.click();
    // Paying needs an account: signed out, it goes to sign in and comes back afterwards
    await expect(page).toHaveURL(/\/login\?next=%2Flists%2Fnew%2Fcheckout$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  } else {
    await expect(create).toContainText("Coming soon");
    await create.click();
    await expect(page).toHaveURL(/\/lists\/new\/checkout$/);
    await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /payment/i })).toHaveCount(0);
  }
});

test("Nick's Top 10 is on The Lists", async ({ page }) => {
  await open(page, "/lists");
  await expect(page.getByText("Nick's all-time Top 10").first()).toBeVisible();
});

// Safari once sized the featured lists too short, so "All lists" slid up underneath them.
// In CI the iPhone run uses WebKit (Safari's engine), which is the one that caught it
test("the featured lists don't overlap All lists", async ({ page }) => {
  await open(page, "/lists");
  const allLists = await page.getByRole("heading", { level: 2, name: "All lists" }).boundingBox();
  const featured = page.getByRole("region", { name: "Featured lists" }).locator(":scope > section");
  expect(await featured.count()).toBeGreaterThan(0);

  for (const box of await featured.all()) {
    const bounds = await box.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(allLists!.y);
  }
});
