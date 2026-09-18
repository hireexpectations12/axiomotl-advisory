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

async function workspace(
  page: Page,
  options: { conflict?: boolean; role?: "editor" | "publisher" | "owner" } = {},
) {
  let state: SiteState = {
    document: structuredClone(baseline) as SiteDocument,
    version: 1,
    publishedAt: null,
    role: options.role || "owner",
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

test("expanded settings persist business, banner and navigation in the draft", async ({
  page,
}) => {
  const { getState } = await workspace(page);
  await page
    .getByRole("button", { name: "Site settings", exact: true })
    .click();
  await page.getByLabel("Phone number", { exact: true }).fill("02 1234 5678");
  await page.getByLabel("Business address", { exact: true }).fill("Sydney");
  await page
    .getByLabel("Default search title", { exact: true })
    .fill("Advisory services");
  await page.getByLabel("Show announcement", { exact: true }).check();
  await page
    .getByLabel("Announcement text", { exact: true })
    .fill("Holiday hours");
  await page.getByLabel("Manage navigation here", { exact: true }).check();
  await expect
    .poll(() => getState().document.settings.business?.phone)
    .toBe("02 1234 5678");
  await expect
    .poll(() => getState().document.settings.announcement?.text)
    .toBe("Holiday hours");
  expect(getState().document.settings.navigation).toHaveLength(2);
  await page.screenshot({
    path: "test-results/settings-expanded.png",
    fullPage: true,
  });
});

test("editor can save settings but cannot publish or see staff administration", async ({
  page,
}) => {
  const { getState } = await workspace(page, { role: "editor" });
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Staff", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Site settings", exact: true })
    .click();
  await page.getByLabel("Phone number", { exact: true }).fill("0412 345 678");
  await expect
    .poll(() => getState().document.settings.business?.phone)
    .toBe("0412 345 678");
});

test("enquiry notes and status save independently from website publishing", async ({
  page,
}) => {
  await workspace(page);
  const enquiry = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Training Client",
    email: "training@example.com",
    organisation: "",
    message: "Discuss analysis",
    source: "email",
    status: "new",
    assignee: "",
    createdAt: "2026-09-19T00:00:00Z",
    notes: [] as { text: string; at: string; actor: string }[],
  };
  await page.route("**/api/enquiries*", (route) => {
    if (route.request().method() === "PATCH") {
      const patch = route.request().postDataJSON();
      if (patch.status) enquiry.status = patch.status;
      if (patch.note)
        enquiry.notes.push({
          text: patch.note,
          at: enquiry.createdAt,
          actor: "Owner",
        });
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: { enquiries: [enquiry], staff: [], hasMore: false },
    });
  });
  await page.getByRole("button", { name: "Enquiries", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Status for Training Client", exact: true })
    .selectOption("in_progress");
  await expect(page.getByText("Enquiry saved.", { exact: true })).toBeVisible();
  await page
    .getByLabel("New note for Training Client", { exact: true })
    .fill("Called the client");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect.poll(() => enquiry.notes.length).toBe(1);
  expect(enquiry.status).toBe("in_progress");
  await page.screenshot({
    path: "test-results/enquiries-expanded.png",
    fullPage: true,
  });
});

test("staff controls protect owners and status screen fits a phone", async ({ page }) => {
  await workspace(page);
  await page.route("**/api/staff", route => route.fulfill({ json: { staff: [{ id: "owner", email: "owner@example.com", role: "owner" }, { id: "editor", email: "editor@example.com", role: "editor" }], currentUserId: "owner" } }));
  await page.route("**/api/status", route => route.fulfill({ json: { checkedAt: "2026-09-19T00:00:00Z", publishedAt: "2026-09-18T00:00:00Z", version: 16, role: "owner", email: "On hold", links: [], forms: [] } }));
  await page.getByRole("button", { name: "Staff", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Role for editor@example.com", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Role for owner@example.com", exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Website status", exact: true }).click();
  await expect(page.getByText("No missing internal pages or sections found.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/status-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Site settings", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/settings-mobile.png", fullPage: true });
});
