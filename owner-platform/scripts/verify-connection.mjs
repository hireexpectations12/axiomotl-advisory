import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const access = JSON.parse(readFileSync(".owner-access.json", "utf8"));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(access.url);
  await page.waitForURL("**/admin?recovery=1");
  console.log("Real owner authentication: PASS");
  const result = await page.evaluate(async () => {
    async function call(path, method = "GET", body) {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(`${path}: ${response.status} ${data.error}`);
      return data;
    }
    const initial = await call("/api/site");
    if (initial.publishedAt)
      throw new Error(
        "This initial verification requires an unpublished project; refusing to change an existing publication.",
      );
    await call("/api/publish", "POST", { version: initial.version });
    const revisions = await call("/api/revisions");
    const published = revisions.revisions.find((r) =>
      r.label.startsWith("Published"),
    );
    const draft = structuredClone(initial.document);
    draft.settings.name = "Private verification draft";
    const saved = await call("/api/site", "PUT", {
      version: initial.version,
      document: draft,
    });
    const stale = await fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: initial.version, document: draft }),
    });
    const restored = await call("/api/restore", "POST", {
      id: published.id,
      version: saved.version,
    });
    return {
      version: restored.version,
      name: restored.document.settings.name,
      staleStatus: stale.status,
    };
  });
  assert.equal(result.staleStatus, 409);
  assert.equal(result.name, "Axiomotl Advisory");
  console.log("Real database seed / publish / save / conflict / restore: PASS");
  await context.storageState({ path: ".auth-state.json" });
  const guest = await browser.newContext();
  const denied = await guest.request.get(new URL("/api/site", access.url).href);
  assert.equal(denied.status(), 401);
  console.log("Guest draft access denied: PASS");
  await page.goto(new URL("/admin", access.url).href);
  await page.getByRole("heading", { name: "Pages", exact: true }).waitFor();
  await page.screenshot({
    path: "test-results/owner-workspace.png",
    fullPage: true,
  });
  console.log("Authenticated dashboard loaded. Screenshot saved.");
} finally {
  await browser.close();
}
