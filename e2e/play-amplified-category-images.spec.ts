import { expect, test } from "@playwright/test";

const categories = [
  { title: "Disc Golf & Putting", href: "#course-games", image: "disc-golf-putting.webp" },
  { title: "Trivia", href: "#trivia-games", image: "trivia.webp" },
  { title: "Social & Cards", href: "#social-games", image: "social-cards.webp" },
  { title: "Mystery & Adventure", href: "#adventure-games", image: "mystery-adventure.webp" },
];

test("category artwork fills responsive links without duplicate titles or page overflow", async ({ page }, testInfo) => {
  await page.goto("/play-amplified");
  const section = page.locator("#game-categories");
  const links = section.locator(":scope > div:last-child > a");
  await expect(links).toHaveCount(categories.length);

  for (const category of categories) {
    const link = section.locator(`a[href="${category.href}"]`);
    const image = link.locator("img");
    await expect(link).toBeVisible();
    await expect(image).toHaveAttribute("alt", category.title);
    await expect(image).toHaveAttribute("src", new RegExp(category.image.replaceAll(".", "\\.")));
    const measurements = await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const image = element.querySelector("img");
      return {
        width: box.width,
        height: box.height,
        imageWidth: image?.naturalWidth ?? 0,
        imageHeight: image?.naturalHeight ?? 0,
        visibleText: element.textContent?.trim() ?? "",
      };
    });
    expect(measurements.width).toBeGreaterThan(120);
    expect(Math.abs(measurements.width / measurements.height - 762 / 506)).toBeLessThan(0.02);
    expect(measurements.imageWidth).toBeGreaterThan(120);
    expect(measurements.imageHeight).toBeGreaterThan(80);
    expect(Math.abs(measurements.imageWidth / measurements.imageHeight - 762 / 506)).toBeLessThan(0.02);
    expect(measurements.visibleText).toBe("");
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("category-cards.png"), fullPage: true });
});
