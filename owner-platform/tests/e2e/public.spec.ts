import { test, expect } from "@playwright/test";

test("published site preserves layout and the guided form returns the mapped service", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From insight to lasting change." }),
  ).toBeVisible();
  await page.locator(".journey-trigger").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", {
      name: "Understanding what's really happening",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", {
      name: "Evidence is fragmented or hard to trust",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", {
      name: "Someone embedded alongside the team",
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Embedded Principal BA Advisory" }),
  ).toBeVisible();
  await dialog
    .getByLabel("Additional context (optional)")
    .fill("A clearer handover");
  await expect(
    dialog.getByRole("link", { name: "Open email draft" }),
  ).toHaveAttribute("href", /A%20clearer%20handover/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/public-desktop.png",
    fullPage: true,
  });
});

test("decision brief accepts free text and displays the complete answer summary", async ({
  page,
}) => {
  await page.goto("/");
  const runner = page.getByRole("region", { name: "Build a decision brief" });
  await runner.getByLabel("Your answer").fill("Make handovers clearer");
  await runner.getByRole("button", { name: "Continue", exact: true }).click();
  await runner.getByLabel("Your answer").fill("A shared checklist");
  await runner.getByRole("button", { name: "Continue", exact: true }).click();
  await runner
    .getByRole("button", { name: "Managing risk", exact: true })
    .click();
  await runner.getByLabel("Your answer").fill("Operations");
  await runner.getByRole("button", { name: "Continue", exact: true }).click();
  await runner.getByLabel("Your answer").fill("Try with one team");
  await runner.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    runner.getByRole("heading", { name: "Your decision brief" }),
  ).toBeVisible();
  await runner.getByText("Your answers", { exact: true }).click();
  await expect(runner.locator("pre")).toContainText("Make handovers clearer");
  await expect(runner.locator("pre")).toContainText("Managing risk");
  await expect(runner.locator("pre")).toContainText("Try with one team");
});

test("mobile navigation and reduced motion work without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/public-mobile.png",
    fullPage: true,
  });
});
