import baseline from "../../generated/baseline.json";
import revision from "../../generated/revision.json";
import { renderPage, publicHeaders } from "../../lib/render";
import { selectPublicFallback } from "../../lib/public-document";
import { readPublished } from "../../lib/server/site";
import type { SiteDocument } from "../../lib/types";
import { revisionOrigin, revisionOrganization } from "../../lib/revision-seo";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  try {
    const fallback = selectPublicFallback(
      process.env.SITE_VARIANT,
      baseline as SiteDocument,
      revision as SiteDocument,
    );
    const document = (await readPublished()) ?? fallback;
    const page = document.pages.find(
      (page) => page.path === `/${(path || []).join("/")}`,
    );
    if (!page)
      return new Response(
        '<!doctype html><html lang="en"><title>Page not found</title><h1>Page not found</h1><a href="/">Back to Axiomotl</a></html>',
        { status: 404, headers: publicHeaders },
      );
    const preview = process.env.VERCEL_ENV === "preview";
    const seo = process.env.SITE_VARIANT === "revision"
      ? { origin: revisionOrigin, organization: revisionOrganization } : undefined;
    return new Response(renderPage(document, preview ? { ...page, noIndex: true } : page, seo), {
      headers: { ...publicHeaders, ...(preview ? { "X-Robots-Tag": "noindex, nofollow" } : {}) },
    });
  } catch {
    return new Response(
      "The website is temporarily unavailable. Please try again shortly.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
