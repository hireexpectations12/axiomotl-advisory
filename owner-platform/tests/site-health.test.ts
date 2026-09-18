import { expect, it } from "vitest";
import baseline from "../src/generated/combined.json";
import { checkSiteLinks } from "../src/lib/site-health";
import type { SiteDocument } from "../src/lib/types";
it("checks configured menus and page anchors without requesting external URLs", () => {
  const doc = structuredClone(baseline) as SiteDocument;
  doc.settings.navigation = [
    { label: "Missing", url: "/missing" },
    { label: "Anchor", url: "#not-here" },
    { label: "Contact", url: "#contact" },
  ];
  const checks = checkSiteLinks(doc);
  expect(checks.some((c) => c.url === "/missing" && c.problem)).toBe(true);
  expect(checks.some((c) => c.url === "#not-here" && c.problem)).toBe(true);
  expect(checks.some((c) => c.url === "#contact" && c.problem)).toBe(false);
});
