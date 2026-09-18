import { load } from "cheerio";
import { renderPage } from "./render";
import type { SiteDocument } from "./types";
export function checkSiteLinks(doc: SiteDocument) {
  const rendered = new Map(
    doc.pages.map((p) => [p.path, load(renderPage(doc, p))]),
  );
  const checks: { page: string; url: string; problem: string }[] = [];
  for (const page of doc.pages) {
    const $ = rendered.get(page.path)!;
    const seen = new Set<string>();
    $("a[href]").each((_, e) => {
      const href = $(e).attr("href") || "";
      if (seen.has(href)) return;
      seen.add(href);
      if (!href || href === "#") {
        checks.push({
          page: page.path,
          url: href,
          problem: "Link has no destination",
        });
        return;
      }
      if (!href.startsWith("/") && !href.startsWith("#")) return;
      if (href.startsWith("/site-assets/") || href.startsWith("/api/")) return;
      const target = new URL(href, `https://site.invalid${page.path}`);
      const destination = rendered.get(target.pathname);
      if (!destination) {
        checks.push({
          page: page.path,
          url: href,
          problem: "Page does not exist in this draft",
        });
        return;
      }
      if (target.hash) {
        let id: string;
        try {
          id = decodeURIComponent(target.hash.slice(1));
        } catch {
          id = target.hash.slice(1);
        }
        if (
          !destination("[id]")
            .toArray()
            .some((el) => destination(el).attr("id") === id)
        )
          checks.push({
            page: page.path,
            url: href,
            problem: "Section does not exist on the destination page",
          });
      }
    });
  }
  return checks;
}
