import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { publicHeaders, renderPage } from "./render";
import type { SiteDocument, SitePage } from "./types";

// An opaque sandbox cannot send Vercel's protection cookie for subresources.
// Embed only our trusted runtime and fonts so previews retain that isolation.
export async function renderPreview(document: SiteDocument, page: SitePage) {
  const nonce = randomBytes(24).toString("base64");
  let html = renderPage(document, page);
  const root = join(process.cwd(), "public");
  for (const name of ["gsap", "site", "forms"]) {
    const script = await readFile(join(root, "runtime", `${name}.js`), "utf8");
    html = html.replace(
      `<script defer src="/runtime/${name}.js"></script>`,
      () =>
        `<script nonce="${nonce}">${script.replace(/<\/script/gi, "<\\/script")}</script>`,
    );
  }
  for (const name of ["forms", "polish"]) {
    const css = await readFile(join(root, "runtime", `${name}.css`), "utf8");
    html = html.replace(
      `<link rel="stylesheet" href="/runtime/${name}.css">`,
      () => `<style>${css}</style>`,
    );
  }
  const fonts = [
    ...new Set(
      html.match(/\/site-assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.ttf/g) ||
        [],
    ),
  ];
  for (const font of fonts) {
    const bytes = await readFile(join(root, font), "base64");
    html = html.replaceAll(font, `data:font/ttf;base64,${bytes}`);
  }
  return {
    html,
    headers: {
      ...publicHeaders,
      "Content-Security-Policy":
        publicHeaders["Content-Security-Policy"]
          .replace("script-src 'self'", `script-src 'nonce-${nonce}'`)
          .replace("font-src 'self'", "font-src 'self' data:") +
        "; sandbox allow-scripts allow-downloads",
    },
  };
}
