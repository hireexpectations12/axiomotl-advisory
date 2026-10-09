import type { MetadataRoute } from "next";
import revision from "../generated/revision.json";
import { revisionOrigin } from "../lib/revision-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.SITE_VARIANT !== "revision" || process.env.VERCEL_ENV === "preview") return [];
  return revision.pages.filter(page => !page.noIndex).map(page => ({
    url: new URL(page.path, revisionOrigin).href,
  }));
}
