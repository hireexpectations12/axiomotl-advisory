import { load } from "cheerio";
import revision from "../../generated/revision.json";
import { publicHeaders, renderPage } from "../../lib/render";
import type { SiteDocument } from "../../lib/types";
import { revisionOrigin, revisionOrganization } from "../../lib/revision-seo";

export function GET(request: Request) {
  const document = structuredClone(revision) as SiteDocument;
  const path = new URL(request.url).searchParams.get("page") || "/";
  const page = document.pages.find((candidate) => candidate.path === path);
  if (!page) return new Response("Page not found", { status: 404 });
  const $ = load(page.html, null, false);
  $("a[href]").each((_, element) => {
    const link = $(element),
      href = link.attr("href")!;
    if (!href.startsWith("/") || href.startsWith("//")) return;
    const target = new URL(href, "https://preview.invalid");
    if (
      document.pages.some((candidate) => candidate.path === target.pathname)
    ) {
      link.attr(
        "href",
        `/revision-preview?page=${encodeURIComponent(target.pathname)}${target.hash}`,
      );
    }
  });
  page.html = $.html();
  return new Response(renderPage(document, { ...page, noIndex: true }, { origin: revisionOrigin, organization: revisionOrganization }), {
    headers: { ...publicHeaders, "X-Robots-Tag": "noindex, nofollow" },
  });
}
