import type { MetadataRoute } from "next";
import { revisionOrigin } from "../lib/revision-seo";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview")
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/preview", "/revision-preview"] },
    ...(process.env.SITE_VARIANT === "revision" ? { sitemap: `${revisionOrigin}/sitemap.xml` } : {}),
  };
}
