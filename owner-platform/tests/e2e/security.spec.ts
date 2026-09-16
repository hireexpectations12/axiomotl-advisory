import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { sanitizeMarkup, validateDraftDocument } from "../../src/lib/render";
import type { SiteDocument } from "../../src/lib/types";

const fixture: SiteDocument = {
  schemaVersion: 1,
  settings: {
    name: "Test",
    email: "hello@example.com",
    favicon: "",
    logo: "",
    font: "Arial",
    background: "#ffffff",
    foreground: "#000000",
    accent: "#123456",
    customCss: "",
    motion: false,
  },
  pages: [
    {
      id: "home",
      path: "/",
      title: "Test",
      description: "",
      socialImage: "",
      noIndex: false,
      html: "<p>Test</p>",
      css: "",
      project: null,
    },
  ],
  forms: [],
};

async function editor(page: Page, components: unknown) {
  await page.setContent('<div id="editor"></div>');
  await page.addScriptTag({
    path: resolve("node_modules/grapesjs/dist/grapes.min.js"),
  });
  await page.evaluate((components) => {
    const runtime = window as unknown as {
      grapesjs: { init: (options: Record<string, unknown>) => unknown };
    };
    runtime.grapesjs.init({
      container: "#editor",
      height: "500px",
      storageManager: false,
      telemetry: false,
      parser: {
        optionsHtml: {
          allowScripts: false,
          allowUnsafeAttr: false,
          allowUnsafeAttrValue: false,
        },
      },
      components,
    });
  }, components);
  await expect(
    page.frameLocator(".gjs-frame").getByText("Hover me"),
  ).toBeVisible();
}

test("untrusted HTML cannot import executable GrapesJS properties", async ({
  page,
}) => {
  const html = sanitizeMarkup(
    '<div data-gjs-script="parent.__securityProof=1" data-gjs-name="&lt;img src=x onerror=window.__securityProof=2&gt;">Hover me</div>',
  );
  await editor(page, html);
  await page.frameLocator(".gjs-frame").getByText("Hover me").hover();
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => Reflect.get(window, "__securityProof")),
  ).toBeUndefined();
});

test("untrusted editor icon metadata cannot execute on hover", async ({
  page,
}) => {
  const doc = structuredClone(fixture);
  doc.pages[0].project = {
    components: [
      {
        type: "text",
        content: "Hover me",
        icon: "<img src=x onerror=window.__securityProof=3>",
      },
    ],
  };
  const components = validateDraftDocument(doc).pages[0].project?.components;
  await editor(page, components);
  await page.frameLocator(".gjs-frame").getByText("Hover me").hover();
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => Reflect.get(window, "__securityProof")),
  ).toBeUndefined();
});
