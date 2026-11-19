import { expect, test } from "@playwright/test";
import { open } from "./helpers";

// List sales are switched off (LIST_SALES_OPEN in src/lib/userListShared.ts).
// When they're back on, change this test to check the checkout instead
test("making a Top 10 says coming soon", async ({ page }) => {
  await open(page, "/lists");
  await page.getByRole("link", { name: /Create your Top 10/ }).click();

  await expect(page).toHaveURL(/\/lists\/new\/checkout$/);
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /pay/i })).toHaveCount(0);
});

test("Nick's Top 10 is on The Lists", async ({ page }) => {
  await open(page, "/lists");
  await expect(page.getByText("Nick's all-time Top 10").first()).toBeVisible();
});
