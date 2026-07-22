import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/games",
  "/live",
  "/shot-caddy",
  "/games/trivia",
  "/music",
  "/about",
  "/contact",
  "/support",
] as const;

for (const route of publicRoutes) {
  test(`${route} has no serious automated accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const seriousViolations = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(seriousViolations).toEqual([]);
  });
}

test("keyboard users can skip to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("contact fields expose accessible names and native validation", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("type", "email");
  const topic = page.locator('select[name="topic"]');
  const product = page.locator('select[name="product"]');
  await expect(topic).toBeVisible();
  await expect(topic).toHaveAccessibleName(/^Topic/);
  await expect(product).toBeVisible();
  await expect(product).toHaveAccessibleName(/^Product/);
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Send Message" }).click();
  expect(await page.getByLabel("Name", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
});
