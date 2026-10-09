import { load } from "cheerio";
import combined from "../generated/combined.json";
import { publicHeaders, renderPage } from "./render";
import type { SiteDocument } from "./types";

const prefix = "/design-preview";

export function renderDesignPreview(path: string) {
  const document = structuredClone(combined) as SiteDocument;
  const page = document.pages.find((page) => page.path === path);
  const headers = { ...publicHeaders, "X-Robots-Tag": "noindex, nofollow" };
  if (!page) return new Response("Page not found", { status: 404, headers });
  const previewUrl = (url: string) => {
    if (url === "/" || url.startsWith("/#")) return prefix + url.slice(1);
    return document.pages.some((page) => page.path === url.split("#")[0])
      ? prefix + url
      : url;
  };
  const $ = load(page.html, null, false);
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")!;
    $(element).attr("href", previewUrl(href));
  });
  document.settings.navigation?.forEach((link) => {
    link.url = previewUrl(link.url);
  });
  document.forms.forEach((form) => {
    form.outcomes.forEach((outcome) => {
      outcome.ctaUrl = previewUrl(outcome.ctaUrl);
    });
  });
  return new Response(
    renderPage(document, { ...page, html: $.html(), noIndex: true }),
    { headers },
  );
}
