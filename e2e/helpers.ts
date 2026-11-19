import { expect, type Page, type TestInfo } from "@playwright/test";

// Opens a page and waits until it's interactive. Clicking before React has loaded would follow
// links as plain page loads instead of opening popups, which isn't what visitors get
export async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} should load`).toBeLessThan(400);
  await page.waitForLoadState("networkidle");
}

// Fails the test if the page throws an error in the browser (a crash or a hydration error)
export function watchForErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

// Nothing may stick out past the right edge and make the page scroll sideways
export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const culprits = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        // Hidden or deliberately clipped things don't count
        return box.width > 0 && box.right > width + 1 && !el.closest("[aria-hidden='true']");
      })
      .slice(0, 3)
      .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`);
    return { scrollWidth: document.documentElement.scrollWidth, width, culprits };
  });
  expect(
    overflow.scrollWidth,
    `page is ${overflow.scrollWidth}px wide on a ${overflow.width}px screen: ${overflow.culprits.join(", ")}`,
  ).toBeLessThanOrEqual(overflow.width + 1);
}

export function isPhone(testInfo: TestInfo) {
  return testInfo.project.name !== "desktop";
}
