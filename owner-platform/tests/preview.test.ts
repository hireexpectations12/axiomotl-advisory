import { it, expect } from "vitest";
import baseline from "../src/generated/baseline.json";
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
