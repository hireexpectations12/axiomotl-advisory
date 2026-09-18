import { it, expect } from "vitest";
import baseline from "../src/generated/baseline.json";
import combined from "../src/generated/combined.json";
import type { SiteDocument } from "../src/lib/types";
import { renderPreview } from "../src/lib/preview";
it("keeps sandbox previews independent of protected runtime and font requests", async () => {
  const document = baseline as SiteDocument;
  const { html, headers } = await renderPreview(document, document.pages[0]);
  expect(html).not.toMatch(/<script[^>]+src="\/runtime/);
  expect(html).not.toContain('href="/runtime/forms.css"');
  expect(html).toContain("data:font/ttf;base64,");
  expect(headers["Content-Security-Policy"]).toContain(
    "sandbox allow-scripts allow-downloads",
  );
  expect(headers["Content-Security-Policy"]).not.toContain("allow-same-origin");
  expect(html).toMatch(/<script nonce="[^"]+">/);
});

it("embeds the combined design's nested fonts in sandbox previews", async () => {
  const document = combined as SiteDocument;
  const { html } = await renderPreview(document, document.pages[0]);
  expect(html).not.toMatch(/\/site-assets\/combined\/lato-\d+\.ttf/);
  expect(html.match(/data:font\/ttf;base64,/g)).toHaveLength(3);
});
