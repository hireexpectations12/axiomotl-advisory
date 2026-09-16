import { chromium } from "@playwright/test";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
if (!process.argv.includes("--import-baseline"))
  throw new Error(
    "This initial handover test imports and publishes the original source. Run explicitly with --import-baseline only before owner handover.",
  );
const access = JSON.parse(readFileSync(".owner-access.json", "utf8"));
const base = new URL(access.url).origin;
const browser = await chromium.launch();
const context = await browser.newContext();
try {
  if (base.includes(".vercel.app")) {
    const cookies = readFileSync(".vercel/preview-cookies.txt", "utf8")
      .split("\n")
      .flatMap((line) => {
        const fields = line.replace(/^#HttpOnly_/, "").split("\t");
        return fields.length === 7
          ? [
              {
                domain: fields[0],
                path: fields[2],
                secure: fields[3] === "TRUE",
                expires: Number(fields[4]),
                name: fields[5],
                value: fields[6].trim(),
                httpOnly: line.startsWith("#HttpOnly_"),
                sameSite: "Lax",
              },
            ]
          : [];
      });
    await context.addCookies(cookies);
  }
  const page = await context.newPage();
  await page.goto(access.url);
  await page.waitForURL("**/admin?recovery=1");
  await context.storageState({ path: ".auth-state.json" });
  async function call(path, method = "GET", data) {
    const response = await context.request.fetch(base + path, {
      method,
      data,
      headers: { Origin: base },
      timeout: 30000,
    });
    const body = await response.json();
    if (!response.ok())
      throw new Error(`${path}: ${response.status()} ${body.error}`);
    return body;
  }
  const initial = await call("/api/site");
  const media = await call("/api/media");
  const baseline = JSON.parse(
    readFileSync("src/generated/baseline.json", "utf8"),
  );
  const replacements = new Map();
  let index = 0;
  for (const name of readdirSync("public/site-assets").filter((name) =>
    name.endsWith(".png"),
  )) {
    const relative = "/site-assets/" + name;
    const assetName =
      relative === baseline.settings.logo
        ? "Axiomotl original logo.png"
        : `Axiomotl original artwork ${++index}.png`;
    let asset = media.assets.find((asset) => asset.name === assetName);
    if (!asset) {
      const upload = await context.request.post(base + "/api/media", {
        headers: { Origin: base },
        multipart: {
          file: {
            name: assetName,
            mimeType: "image/png",
            buffer: readFileSync("public" + relative),
          },
        },
        timeout: 30000,
      });
      assert.equal(upload.status(), 201);
      asset = (await upload.json()).asset;
    }
    assert.equal((await context.request.get(asset.url)).status(), 200);
    replacements.set(relative, asset.url);
  }
  const bad = await context.request.post(base + "/api/media", {
    headers: { Origin: base },
    multipart: {
      file: {
        name: "rejected.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="evil()"></svg>'),
      },
    },
  });
  assert.equal(bad.status(), 400);
  console.log(
    "Real image upload, storage retrieval and unsafe-file rejection: PASS",
  );
  // Import the reviewed source with the persistent media URLs before owner handover.
  // Only run this explicit import while the new platform has not been handed over.
  let source = JSON.stringify(baseline);
  for (const [oldUrl, newUrl] of replacements)
    source = source.replaceAll(oldUrl, newUrl);
  let current = await call("/api/site", "PUT", {
    version: initial.version,
    document: JSON.parse(source),
  });
  await call("/api/publish", "POST", { version: current.version });
  const published = (await call("/api/revisions")).revisions.find(
    (revision) => revision.label === `Published revision ${current.version}`,
  );
  try {
    const draft = structuredClone(current.document);
    draft.settings.name = "Private verification draft";
    current = await call("/api/site", "PUT", {
      version: current.version,
      document: draft,
    });
    const publicResponse = await context.request.get(base + "/");
    const publicHtml = await publicResponse.text();
    assert.ok(!publicHtml.includes("Private verification draft"));
    const stale = await context.request.put(base + "/api/site", {
      headers: { Origin: base },
      data: { version: current.version - 1, document: draft },
    });
    assert.equal(stale.status(), 409);
    const wrongOrigin = await context.request.put(base + "/api/site", {
      headers: { Origin: "https://invalid.example" },
      data: { version: current.version, document: draft },
    });
    assert.equal(wrongOrigin.status(), 403);
    console.log(
      "Real save persistence, private drafts, stale-save and origin protection: PASS",
    );
  } finally {
    await call("/api/restore", "POST", {
      id: published.id,
      version: current.version,
    });
  }
  const reopened = await call("/api/site");
  assert.equal(reopened.document.settings.name, "Axiomotl Advisory");
  const exportResponse = await call("/api/export");
  assert.ok(exportResponse.renderedPages.length);
  assert.ok(exportResponse.assets.length >= 3);
  const guest = await browser.newContext();
  if (base.includes(".vercel.app")) {
    const cookies = await context.cookies();
    await guest.addCookies(cookies.filter((c) => c.name === "_vercel_jwt"));
  }
  assert.equal((await guest.request.get(base + "/api/site")).status(), 401);
  console.log("Real restore/export and anonymous draft denial: PASS");
  await page.goto(base + "/admin");
  await page.getByRole("heading", { name: "Pages", exact: true }).waitFor();
  await page.getByRole("button", { name: "Desktop", exact: true }).waitFor();
  mkdirSync("test-results-live", { recursive: true });
  await page.screenshot({
    path: "test-results-live/owner-workspace.png",
    fullPage: true,
  });
  const preview = await context.newPage();
  await preview.goto(base + "/api/preview?page=home");
  await preview.locator(".form-runner").first().waitFor();
  await preview.evaluate(() => document.fonts.ready);
  assert.equal(
    await preview.evaluate(() => document.fonts.check("16px Nunito")),
    true,
  );
  console.log("Authenticated dashboard and isolated draft preview: PASS");
} finally {
  await browser.close();
}
