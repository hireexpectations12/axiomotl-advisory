import baseline from "../../generated/baseline.json";
import { renderPage, publicHeaders } from "../../lib/render";
import { readPublished } from "../../lib/server/site";
import type { SiteDocument } from "../../lib/types";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  try {
    const document = (await readPublished()) ?? (baseline as SiteDocument);
    const page = document.pages.find(
      (page) => page.path === `/${(path || []).join("/")}`,
    );
    if (!page)
      return new Response(
        '<!doctype html><html lang="en"><title>Page not found</title><h1>Page not found</h1><a href="/">Back to Axiomotl</a></html>',
        { status: 404, headers: publicHeaders },
      );
    return new Response(renderPage(document, page), { headers: publicHeaders });
  } catch {
    return new Response(
      "The website is temporarily unavailable. Please try again shortly.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
