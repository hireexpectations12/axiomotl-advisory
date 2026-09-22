import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";

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
const home = next.pages.find((page: { path: string }) => page.path === "/");
if (!home || home.project) throw new Error("Reconcile editor structure first.");
const $ = load(home.html);
for (const id of ["starting-point"])
  if ($(`section#${id}`).length !== 1)
    throw new Error(`Missing section: ${id}`);
const css = await readFile(
  new URL("../design/combined/mobile-hero-gap.css", import.meta.url),
  "utf8",
);
if (home.css.includes("/* Mobile header-to-hero content gap: 50px total. */"))
  throw new Error(
    "Background update already present; inspect before repeating.",
  );
home.css += `\n${css}`;
const document = validateDocument(next);
const backupDir = new URL("../../outputs/release-backups/", import.meta.url);
await mkdir(backupDir, { recursive: true });
await writeFile(
  new URL(`mobile-hero-gap-${Date.now()}.json`, backupDir),
  JSON.stringify({ draft, publication: publication.data }, null, 2),
);
await writeFile(
  new URL(
    "../../outputs/live-backgrounds/proposed-document.json",
    import.meta.url,
  ),
  JSON.stringify(document, null, 2),
);
if (!process.argv.includes("--publish")) {
  console.log({ status: "validated", version: draft.version, sections: 1 });
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

