import { expect, test } from "@playwright/test";

const categories = [
  { title: "Disc Golf & Putting", href: "#course-games" },
  { title: "Trivia", href: "#trivia-games" },
  { title: "Social & Cards", href: "#social-games" },
  { title: "Mystery & Adventure", href: "#adventure-games" },
];

test("category artwork fills responsive links without duplicate titles or page overflow", async ({ page }, testInfo) => {
  await page.goto("/play-amplified");
  const section = page.locator("#game-categories");
  await expect(section.locator("img")).toHaveCount(categories.length);

  for (const category of categories) {
    const link = section.locator(`a[href="${category.href}"]`);
    const image = link.locator("img");
    await expect(link).toBeVisible();
    await expect(image).toHaveAttribute("alt", category.title);
    const measurements = await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const image = element.querySelector("img");
      return {
        width: box.width,
        height: box.height,
        imageWidth: image?.naturalWidth ?? 0,
        imageHeight: image?.naturalHeight ?? 0,
        imageFit: image ? getComputedStyle(image).objectFit : "",
        visibleText: element.textContent?.trim() ?? "",
      };
    });
    expect(measurements.width).toBeGreaterThan(120);
    expect(Math.abs(measurements.width / measurements.height - 762 / 506)).toBeLessThan(0.02);
    expect(measurements.imageWidth).toBeGreaterThan(0);
    expect(measurements.imageHeight).toBeGreaterThan(0);
    expect(measurements.imageFit).toBe("cover");
    expect(measurements.visibleText).toBe("");
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("category-cards.png") });
});
