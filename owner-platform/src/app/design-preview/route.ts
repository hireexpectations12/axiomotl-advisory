import combined from "../../generated/combined.json";
import { publicHeaders, renderPage } from "../../lib/render";
import type { SiteDocument } from "../../lib/types";

export function GET() {
  const document = combined as SiteDocument;
  return new Response(
    renderPage(document, { ...document.pages[0], noIndex: true }),
    { headers: { ...publicHeaders, "X-Robots-Tag": "noindex, nofollow" } },
  );
}
