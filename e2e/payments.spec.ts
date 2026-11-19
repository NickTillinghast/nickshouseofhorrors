import { expect, test } from "@playwright/test";

// The doors into payments must stay locked. None of these touch Stripe or save anything.
// Request-only tests, so they run once (desktop), not on every screen size

test.describe("payments", () => {
  test.skip(({ isMobile }) => isMobile, "checked once on desktop");

  test("the Stripe webhook refuses requests without a signature", async ({ request }) => {
    const response = await request.post("/api/stripe/webhook", {
      data: { type: "checkout.session.completed", data: { object: {} } },
    });
    expect(response.status()).toBe(400);
  });

  // A forged "payment completed" must never create a list
  test("the Stripe webhook refuses a forged signature", async ({ request }) => {
    const response = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=${"0".repeat(64)}` },
      data: { type: "checkout.session.completed", data: { object: {} } },
    });
    expect(response.status()).toBe(400);
  });

  test("the payment success page needs a real payment", async ({ page }) => {
    // No payment id, or one that isn't a Stripe checkout id
    for (const path of ["/lists/checkout/success", "/lists/checkout/success?session_id=nope"]) {
      await page.goto(path);
      await expect(page.getByText(/not found|404/i).first()).toBeVisible();
    }
  });

  test("the payment success page needs you signed in", async ({ page }) => {
    await page.goto("/lists/checkout/success?session_id=cs_test_made_up");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("the footer links to Terms, Privacy and Refunds", async ({ page }) => {
    await page.goto("/home");
    const legal = page.getByRole("navigation", { name: "Legal" });
    for (const [name, path] of [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Refunds", "/refunds"],
    ]) {
      await expect(legal.getByRole("link", { name })).toHaveAttribute("href", path);
    }
  });
});
