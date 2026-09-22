import { load } from "cheerio";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { renderPage, validateDocument } from "../src/lib/render";

const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const site = process.env.SITE_ID || "00000000-0000-4000-8000-000000000001";
const { data: draft, error } = await db
  .from("drafts")
  .select("document,version")
  .eq("site_id", site)
  .single();
const publication = await db.rpc("read_published", { p_site: site });
if (error || publication.error) throw new Error("Cannot read website state.");
if (JSON.stringify(draft.document) !== JSON.stringify(publication.data))
  throw new Error("Unpublished edits exist; reconcile before publishing.");

const next = structuredClone(publication.data);
const css = await readFile(new URL("../design/combined/responsive.css", import.meta.url), "utf8");
if (next.pages.some((page: { path: string }) => page.path === "/approach")) throw new Error("Approach page already exists.");
const services = next.pages.find((page: { path: string }) => page.path === "/services");
if (!services) throw new Error("Services template missing.");
const $ = load(services.html, null, false);
$("main").replaceWith(await readFile(new URL("../design/approach/content.html", import.meta.url), "utf8"));
$(".svc-skip").attr("href", "#approach-main");
$("[aria-current]").removeAttr("aria-current");
next.pages.push({ ...services, id: "approach-detail", path: "/approach", title: "Our Approach | Axiomotl Advisory", description: "How Axiomotl works with your team: analyse the situation, design practical options, make decisions, prepare for transition and sustain the change.", html: $.html(), project: null });
for (const page of next.pages) {
  page.html = page.html.replace(/href="(?:\/#method|#method)">Our approach<\/a>/g, 'href="/approach">Our approach</a>');
  if (page.path === "/approach") page.html = page.html.replaceAll('href="/approach">Our approach</a>', 'href="/approach" aria-current="page">Our approach</a>');
  if (page.path === "/") {
    const h = load(page.html, null, false);
    h("#finder-title").html('Where is the work getting <strong class="heading-accent">stuck?</strong>');
    h("#services > h2").html('Four ways to work with <strong class="heading-accent">us.</strong>');
    page.html = h.html();
  }
}
for (const page of next.pages) {
  if (!["/", "/services", "/approach"].includes(page.path)) continue;
  if (page.project) throw new Error("Editor structure changed; reconcile first.");
  page.css += "\n" + css;
  await writeFile(new URL(`../public/responsive-${page.path === "/" ? "home" : page.path.slice(1)}.html`, import.meta.url), renderPage(next, { ...page, noIndex: true }));
}
const document = validateDocument(next);
const backupDir = new URL("../../outputs/release-backups/", import.meta.url);
await mkdir(backupDir, { recursive: true });
await writeFile(
  new URL(`responsive-${Date.now()}.json`, backupDir),
  JSON.stringify({ draft, publication: publication.data }, null, 2),
);
await writeFile(
  new URL(
    "../../outputs/services-page/proposed-document.json",
    import.meta.url,
  ),
  JSON.stringify(document, null, 2),
);
if (!process.argv.includes("--publish")) {
  console.log({ status: "validated", version: draft.version, pages: 3 });
  process.exit(0);
}

const membership = await db
  .from("memberships")
  .select("user_id")
  .eq("site_id", site);
if (membership.error) throw new Error("Cannot verify owner.");
let actor: string | undefined;
for (const member of membership.data || []) {
  const user = await db.auth.admin.getUserById(member.user_id);
  if (user.data.user && !user.data.user.app_metadata.axiomotl_roles?.[site]) {
    actor = member.user_id;
    break;
  }
}
if (!actor) throw new Error("No protected owner found.");
const saved = await db.rpc("owner_change", {
  p_site: site,
  p_actor: actor,
  p_action: "save",
  p_expected: draft.version,
  p_document: document,
});
if (saved.error) throw new Error("Save failed or draft changed concurrently.");
const published = await db.rpc("owner_change", {
  p_site: site,
  p_actor: actor,
  p_action: "publish",
  p_expected: saved.data.version,
  p_document: document,
});
if (published.error)
  throw new Error("Publish failed; changes remain in draft.");
console.log({
  status: "published",
  version: published.data.version,
  publishedAt: published.data.publishedAt,
});
