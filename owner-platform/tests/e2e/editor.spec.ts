import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { SiteDocument, SiteState } from "../../src/lib/types";
import { validateDraftDocument } from "../../src/lib/render";
const baseline = JSON.parse(
  readFileSync(
    new URL("../../src/generated/baseline.json", import.meta.url),
    "utf8",
  ),
) as SiteDocument;

async function workspace(page: Page, options: { conflict?: boolean } = {}) {
  let state: SiteState = {
    document: structuredClone(baseline) as SiteDocument,
    version: 1,
    publishedAt: null,
  };
  const writes: SiteState[] = [];
  const exceptions: string[] = [];
  page.on("pageerror", (error) => exceptions.push(error.message));
  await page.route("**/api/site", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: state });
    if (options.conflict)
      return route.fulfill({
        status: 409,
        json: { error: "Another session saved first." },
      });
    const body = route.request().postDataJSON();
    let document: SiteDocument;
    try {
      document = validateDraftDocument(body.document);
    } catch (error) {
      await test.info().attach("rejected-editor-document", {
        body: JSON.stringify(body.document),
        contentType: "application/json",
      });
      return route.fulfill({
        status: 400,
        json: { error: (error as Error).message },
      });
    }
    state = { ...state, document, version: state.version + 1 };
    writes.push(structuredClone(state));
    return route.fulfill({ json: state });
  });
  await page.route("**/api/revisions", (route) =>
    route.fulfill({ json: { revisions: [] } }),
  );
  await page.route("**/api/media", (route) =>
    route.fulfill({ json: { assets: [] } }),
  );
  await page.route("**/api/publish", (route) => {
    const body = route.request().postDataJSON();
    if (body.version !== state.version)
      return route.fulfill({
        status: 409,
        json: { error: "Version conflict" },
      });
    state = { ...state, publishedAt: new Date().toISOString() };
    return route.fulfill({ json: state });
  });
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Pages", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Desktop", exact: true }),
  ).toBeEnabled();
  return { writes, exceptions, getState: () => state };
}

test("visual page edits round-trip as editor data and HTML; new page settings persist", async ({
  page,
}) => {
  const { writes, exceptions } = await workspace(page);
  const canvas = page.frameLocator(".gjs-frame");
  const heading = canvas.locator("h1").first();
  await expect(heading).toBeVisible();
  await expect(canvas.locator("body")).toHaveCSS("font-family", /Nunito/);
  await page.screenshot({
    path: "test-results/owner-desktop.png",
    fullPage: true,
  });
  await heading.dblclick();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Advisory built around your next decision");
  await page.getByRole("heading", { name: "Pages", exact: true }).click();
  await expect
    .poll(() =>
      writes.some((write) =>
        write.document.pages[0].html.includes(
          "Advisory built around your next decision",
        ),
      ),
    )
    .toBeTruthy();
  expect(writes.at(-1)?.document.pages[0].project).not.toBeNull();
  expect(writes.at(-1)?.document.pages[0].css).toMatch(
    /font:\s*400 16px\s*\/\s*1\.55 var\(--font-body\)/,
  );
  await page.getByRole("button", { name: "Add page", exact: true }).click();
  await page.getByLabel("Page title", { exact: true }).fill("Our approach");
  await page.getByLabel("Page path", { exact: true }).fill("/approach");
  await page
    .getByLabel("Search description")
    .fill("How Axiomotl helps you decide what comes next.");
  await expect
    .poll(() =>
      writes
        .at(-1)
        ?.document.pages.some(
          (p) => p.title === "Our approach" && p.path === "/approach",
        ),
    )
    .toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Desktop", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Current page")).toContainText("Our approach");
  await expect(
    page.frameLocator(".gjs-frame").locator("h1").first(),
  ).toHaveText("Advisory built around your next decision");
  expect(exceptions).toEqual([]);
});

test("owner can jump to lower sections, edit the footer and access hidden tabs", async ({
  page,
}) => {
  const { writes } = await workspace(page);
  const jump = page.getByLabel("Jump to section");
  await expect(jump).toBeVisible();
  const canvas = page.frameLocator(".gjs-frame");
  for (const name of ["Header", "Hero", "Contact", "Footer"]) {
    await jump.selectOption({ label: name });
    const selector = {
      Header: "header",
      Hero: ".wave-hero",
      Contact: "#contact",
      Footer: "footer",
    }[name]!;
    await expect(canvas.locator(selector)).toBeInViewport();
  }
  const footerHeading = canvas.locator("footer h3, footer h2").first();
  await footerHeading.dblclick();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Owner edited footer");
  await page.getByRole("heading", { name: "Pages", exact: true }).click();
  await expect
    .poll(() =>
      writes.at(-1)?.document.pages[0].html.includes("Owner edited footer"),
    )
    .toBeTruthy();
  await page.getByLabel("Show hidden tab and menu content").check();
  await expect(canvas.locator("#panel-decide")).toBeVisible();
  await expect(canvas.locator("#connection-processes")).toHaveCSS(
    "visibility",
    "visible",
  );
  expect(writes.at(-1)?.document.pages[0].html).not.toContain(
    "data-editor-reveal",
  );
  expect(writes.at(-1)?.document.pages[0].css).not.toContain(
    "data-editor-reveal",
  );
  await page.reload();
  await expect(canvas.locator("footer")).toContainText("Owner edited footer");
  await expect(canvas.locator("#panel-decide")).toBeHidden();
});

test("conflict preserves local work and offers explicit recovery", async ({
  page,
}) => {
  const { exceptions } = await workspace(page, { conflict: true });
  await page
    .getByRole("button", { name: "Page settings", exact: true })
    .click();
  await page
    .getByLabel("Page title", { exact: true })
    .fill("Unsaved owner title");
  await expect(page.locator(".notice.error")).toContainText(
    "Another session saved a newer draft",
  );
  await expect(page.getByLabel("Page title", { exact: true })).toHaveValue(
    "Unsaved owner title",
  );
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my work" }).click();
  expect((await download).suggestedFilename()).toBe(
    "axiomotl-unsaved-work.json",
  );
  await page.getByRole("button", { name: "Load latest draft…" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Page title", { exact: true })).toHaveValue(
    "Unsaved owner title",
  );
  expect(exceptions).toEqual([]);
});

test("form outcome editing and actual path tester share draft data", async ({
  page,
}) => {
  const { writes, exceptions } = await workspace(page);
  await page.getByRole("button", { name: "Forms", exact: true }).click();
  await page.getByRole("button", { name: "Add form", exact: true }).click();
  const outcome = page
    .locator("details.panel")
    .filter({ has: page.getByLabel("Title / recommended service") })
    .last();
  await outcome.locator("summary").click();
  await outcome
    .getByLabel("Title / recommended service")
    .fill("A clear route forward");
  await outcome
    .getByLabel("Explanation")
    .fill("Your next step is a focused discovery session.");
  await page.getByRole("button", { name: "An answer", exact: true }).click();
  await expect(
    page
      .locator(".form-runner")
      .getByRole("heading", { name: "A clear route forward" }),
  ).toBeVisible();
  await expect(page.locator(".form-runner")).toContainText(
    "Your next step is a focused discovery session.",
  );
  await expect
    .poll(() =>
      writes
        .at(-1)
        ?.document.forms.some((form) =>
          form.outcomes.some((o) => o.title === "A clear route forward"),
        ),
    )
    .toBeTruthy();
  expect(exceptions).toEqual([]);
});

test("narrow workspace keeps settings and navigation reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { exceptions } = await workspace(page);
  await page
    .getByRole("button", { name: "Site settings", exact: true })
    .click();
  await expect(page.getByLabel("Site name", { exact: true })).toBeVisible();
  await page.getByLabel("Site name", { exact: true }).fill("Axiomotl Advisory");
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/owner-mobile.png",
    fullPage: true,
  });
  expect(exceptions).toEqual([]);
});

test("publication requires confirmation and saves the current draft first", async ({
  page,
}) => {
  const { getState, exceptions } = await workspace(page);
  await page
    .getByRole("button", { name: "Site settings", exact: true })
    .click();
  await page
    .getByLabel("Site name", { exact: true })
    .fill("Axiomotl · owner-reviewed draft");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  expect(getState().publishedAt).toBeNull();
  await expect(
    page.getByRole("heading", { name: "Publish this website?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish website", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Published. The saved revision is now live.",
  );
  expect(getState().document.settings.name).toBe(
    "Axiomotl · owner-reviewed draft",
  );
  expect(getState().publishedAt).not.toBeNull();
  expect(exceptions).toEqual([]);
});
