import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { SiteDocument } from "../../src/lib/types";
import { validateDraftDocument } from "../../src/lib/render";

// Functional checks stay deterministic; the dedicated canvas test opts into motion.
test.use({ reducedMotion: "reduce" });

const combined = JSON.parse(
  readFileSync(
    new URL("../../src/generated/combined.json", import.meta.url),
    "utf8",
  ),
) as SiteDocument;

test("combined page loads its local assets, links and disclosures", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const response = await page.goto("/design-preview");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(
    page.getByRole("heading", { name: "Turn complexity into clarity." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".reference-art")).toHaveCount(0);
  await expect(page.locator("#hero-title")).toHaveCSS("opacity", "1");
  for (const statement of await page.locator(".hero-side").all()) {
    await expect(statement).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  expect(await page.evaluate(() => document.fonts.check("900 20px Lato"))).toBe(
    true,
  );
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href")!.slice(1))
        .filter((id) => id && !document.getElementById(id)),
    );
  expect(missing).toEqual([]);
  for (const summary of await page
    .locator(".service-card summary, .reading-details > summary")
    .all()) {
    await summary.click();
    await expect(summary.locator("..")).toHaveAttribute("open", "");
    await summary.click();
  }
  expect(errors).toEqual([]);
});

for (const outcome of combined.forms[0].outcomes) {
  test(`service finder routes to ${outcome.id} and restores keyboard focus`, async ({
    page,
  }) => {
    await page.goto("/design-preview");
    const trigger = page.locator(
      `.finder-choices [data-journey-answer="${outcome.id}"]`,
    );
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText(
      combined.forms[0].questions.find(
        (question) => question.id === `context-${outcome.id}`,
      )!.title,
    );
    await dialog.locator(".stack > button[aria-pressed]").first().click();
    await dialog
      .getByRole("button", { name: "A focused piece of work", exact: true })
      .click();
    await expect(
      dialog.getByRole("heading", { name: outcome.title }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test("embedded preference overrides the initial service and back preserves answers", async ({
  page,
}) => {
  await page.goto("/design-preview");
  await page
    .locator('.finder-choices [data-journey-answer="diagnostic"]')
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", {
      name: "Evidence is fragmented or hard to trust",
      exact: true,
    })
    .click();
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    dialog.getByRole("button", {
      name: "Evidence is fragmented or hard to trust",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
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
    .fill("Ownership across teams");
  await expect(
    dialog.getByRole("link", { name: "Open email draft" }),
  ).toHaveAttribute("href", /Ownership%20across%20teams/);
});

test("decision brief validates, accepts answers, downloads and restarts", async ({
  page,
}) => {
  await page.goto("/design-preview");
  const runner = page.getByRole("region", { name: "Build a decision brief" });
  await runner.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(runner.getByRole("alert")).toHaveText(
    "Enter an answer to continue.",
  );
  await expect(runner.getByLabel("Your answer")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  for (const answer of ["Make handovers clearer", "A shared checklist"]) {
    await runner.getByLabel("Your answer").fill(answer);
    await runner.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await runner
    .getByRole("button", { name: "Managing risk", exact: true })
    .click();
  for (const answer of ["Operations", "Try with one team"]) {
    await runner.getByLabel("Your answer").fill(answer);
    await runner.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await expect(
    runner.getByRole("heading", { name: "Your decision brief" }),
  ).toBeVisible();
  await runner.getByText("Your answers", { exact: true }).click();
  await expect(runner.locator("pre")).toContainText("Try with one team");
  await expect(runner.locator("pre")).toContainText("Managing risk");
  const downloadEvent = page.waitForEvent("download");
  await runner.getByRole("button", { name: "Download summary" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    "decision-summary.txt",
  );
  await runner.getByRole("button", { name: "Start again" }).click();
  await expect(runner.getByLabel("Your answer")).toHaveValue("");
});

test("mobile menu, reduced motion and narrow layouts remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/design-preview");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 768) {
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await expect(page.locator("#mobile-nav")).toBeVisible();
      await page.locator('#mobile-nav a[href="#decision-brief"]').click();
      await expect(page.locator("#mobile-nav")).toBeHidden();
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toBeFocused();
    }
  }
});

test("combined document remains editable and saveable in the existing owner workspace", async ({
  page,
}) => {
  let document = structuredClone(combined);
  let version = 1;
  await page.route("**/api/site", async (route) => {
    if (route.request().method() === "PUT") {
      document = validateDraftDocument(
        route.request().postDataJSON().document,
      ) as typeof combined;
      version++;
    }
    await route.fulfill({ json: { document, version, publishedAt: null } });
  });
  await page.route("**/api/revisions", (route) =>
    route.fulfill({ json: { revisions: [] } }),
  );
  await page.route("**/api/media", (route) =>
    route.fulfill({ json: { assets: [] } }),
  );
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Desktop", exact: true }),
  ).toBeEnabled();
  const canvas = page.frameLocator(".gjs-frame");
  await expect(canvas.locator("h1")).toContainText("Turn complexity");
  await expect(canvas.locator("body")).toHaveCSS("font-family", /Lato/);
  await canvas.locator("h1").dblclick({ position: { x: 30, y: 20 } });
  await expect(canvas.locator("h1")).toHaveAttribute("contenteditable", "true");
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Clarity for your next decision");
  await page.getByRole("heading", { name: "Pages", exact: true }).click();
  await expect
    .poll(() => document.pages[0].html)
    .toContain("Clarity for your next decision");
  expect(document.forms).toEqual(combined.forms);
  expect(document.pages[0].html).toContain('data-axiomotl-form="decision"');
  await page.reload();
  await expect(page.frameLocator(".gjs-frame").locator("h1")).toHaveText(
    "Clarity for your next decision",
  );
});

test("five icon stages support keyboard selection and route to the right service", async ({
  page,
}) => {
  await page.goto("/design-preview");
  const hero = page.locator("[data-interactive-hero]");
  await expect(page.locator("header .brand img")).toHaveAttribute(
    "src",
    "/site-assets/combined/axiomotl-axolotl.png",
  );
  const names = ["Analyse", "Design", "Decide", "Transition", "Sustain"];
  const services = [
    "diagnostic",
    "diagnostic",
    "decisions",
    "transition",
    "embedded",
  ];
  await expect(hero.locator("[data-stage]")).toHaveCount(5);
  await hero.locator("[data-stage]").first().focus();
  for (let i = 0; i < names.length; i++) {
    if (i) await page.keyboard.press("ArrowRight");
    const button = hero.locator(`[data-stage="${i}"]`);
    await expect(button).toBeFocused();
    await expect(button).toContainText(names[i]);
    await expect(button).toHaveAttribute("href", `#${services[i]}`);
  }
  await hero.locator('[data-stage="3"]').click();
  await expect(page).toHaveURL(/#transition$/);
  await expect(hero.locator(".circuit-bottom")).toHaveCount(0);
});

test("GSAP signals animate and the footer motion control pauses and resumes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/design-preview");
  const hero = page.locator("[data-interactive-hero]");
  await expect(hero).toHaveAttribute("data-animation", "gsap");
  const dot = hero.locator("[data-signal]").first();
  const position = () => dot.getAttribute("transform");
  const before = await position();
  await expect.poll(position).not.toBe(before);
  const arc = hero.locator("[data-arc]").first();
  const arcOffset = () =>
    arc.evaluate((element) => getComputedStyle(element).strokeDashoffset);
  const glow = hero.locator(".hero-glow").first();
  const glowTransform = () =>
    glow.evaluate((element) => getComputedStyle(element).transform);
  const initialArc = await arcOffset();
  const initialGlow = await glowTransform();
  await expect.poll(arcOffset).not.toBe(initialArc);
  await expect.poll(glowTransform).not.toBe(initialGlow);
  await page.locator("#site-motion").click();
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  await expect(page.locator("#site-motion")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const paused = await position();
  const pausedArc = await arcOffset();
  const pausedGlow = await glowTransform();
  await page.waitForTimeout(200);
  expect(await position()).toBe(paused);
  expect(await arcOffset()).toBe(pausedArc);
  expect(await glowTransform()).toBe(pausedGlow);
  await page.locator("#site-motion").click();
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-paused", "false");
  await expect.poll(position).not.toBe(paused);
  await expect(hero.locator(".circuit-bottom")).toHaveCount(0);
});
test("mobile reduced-motion scene retains all five non-overlapping controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-preview");
  const hero = page.locator("[data-interactive-hero]");
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  expect((await hero.boundingBox())!.height).toBeLessThan(1250);
  const buttons = hero.locator("[data-stage]");
  for (let i = 0; i < 5; i++) {
    await buttons.nth(i).focus();
    await page.keyboard.press(i === 0 ? "Home" : "ArrowRight");
    await buttons.nth(i).scrollIntoViewIfNeeded();
    const box = await buttons.nth(i).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  await expect(buttons.last()).toHaveAttribute("href", "#embedded");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("icon stages remain usable when GSAP is unavailable", async ({ page }) => {
  await page.route("**/runtime/gsap.js", (route) =>
    route.fulfill({ body: "", contentType: "text/javascript" }),
  );
  await page.goto("/design-preview");
  const hero = page.locator("[data-interactive-hero]");
  await hero.locator('[data-stage="4"]').click();
  await expect(page).toHaveURL(/#embedded$/);
});

test("reference header and hero links remain real navigation targets", async ({
  page,
}) => {
  await page.goto("/design-preview");
  await page.locator('.desktop-nav a[href="#philosophy"]').click();
  await expect(page).toHaveURL(/#philosophy$/);
  await page.locator(".circuit-hero").scrollIntoViewIfNeeded();
  await page.locator(".circuit-primary").click();
  await expect(page).toHaveURL(/#starting-point$/);
});

test("page feedback resets when motion is disabled and disclosures stay usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/design-preview");
  const control = page.locator(".finder-choices > a").first();
  const cue = control.locator("span").last();
  await control.focus();
  await expect
    .poll(() => cue.evaluate((e) => getComputedStyle(e).transform))
    .not.toBe("none");
  await page.locator("#site-motion").click();
  await expect
    .poll(() => cue.evaluate((e) => getComputedStyle(e).transform))
    .toBe("none");
  const summary = page.locator(".service-card summary").first();
  await summary.click();
  const content = page.locator(".service-detail").first();
  await expect(content).toBeVisible();
  await expect(content).toHaveCSS("opacity", "1");
  await page.locator("#site-motion").click();
  await summary.click();
  await summary.click();
  await expect(content).toBeVisible();
  await expect(content).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await control.focus();
  await expect(cue).toHaveCSS("transform", "none");
});

test("public layout uses shared margins and aligned diagram panels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/design-preview");
  const values = await page.evaluate(() => {
    const rect = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    return {
      hero: rect(".circuit-copy").x,
      content: rect("#services").x,
      diagramTops: [...document.querySelectorAll(".analysis-example")].map(
        (e) => e.getBoundingClientRect().top,
      ),
      diagramWidths: [...document.querySelectorAll(".analysis-example")].map(
        (e) => e.getBoundingClientRect().width,
      ),
    };
  });
  expect(Math.abs(values.hero - values.content)).toBeLessThan(1);
  expect(Math.abs(values.diagramTops[0] - values.diagramTops[1])).toBeLessThan(
    1,
  );
  expect(
    Math.abs(values.diagramWidths[0] - values.diagramWidths[1]),
  ).toBeLessThan(1);
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
});

test("GSAP hover keeps card geometry stable across breakpoints and motion off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/design-preview");
  const card = page.locator(".circuit-tile").first();
  await expect(page.locator("[data-interactive-hero]")).toHaveAttribute(
    "data-animation",
    "gsap",
  );
  const before = await card.boundingBox();
  await card.hover();
  await expect
    .poll(() =>
      card.evaluate((e) =>
        Number(getComputedStyle(e).getPropertyValue("--tile-brightness")),
      ),
    )
    .toBeGreaterThan(1.1);
  const after = await card.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
  await page.locator("#site-motion").click();
  await expect
    .poll(() =>
      card.evaluate((e) =>
        Number(getComputedStyle(e).getPropertyValue("--tile-brightness")),
      ),
    )
    .toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  const heights = await page
    .locator(".circuit-tile")
    .evaluateAll((cards) => cards.map((e) => e.getBoundingClientRect().height));
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  await expect(card).toHaveCSS("--card-tilt", "12deg");
});
