import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { validateDocument } from "../src/lib/render";
const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const site = process.env.SITE_ID!;
const { data: draft, error } = await db
  .from("drafts")
  .select("document,version")
  .eq("site_id", site)
  .single();
const pub = await db.rpc("read_published", { p_site: site });
if (
  error ||
  pub.error ||
  JSON.stringify(draft.document) !== JSON.stringify(pub.data)
)
  throw Error("Unpublished changes require reconciliation");
const css = await readFile(
  new URL("../design/combined/palette.css", import.meta.url),
  "utf8",
);
const marker = "/* Axiomotl supplied brand palette";
const next = structuredClone(draft.document);
next.settings.background = "#f7f7fa";
next.settings.foreground = "#333333";
next.settings.accent = "#481e72";
for (const page of next.pages) {
  const start = page.css.indexOf(marker);
  page.css = (start < 0 ? page.css : page.css.slice(0, start)) + "\n" + css;
}
const document = validateDocument(next);
const { data: members } = await db
  .from("memberships")
  .select("user_id")
  .eq("site_id", site);
let actor;
for (const m of members || []) {
  const u = await db.auth.admin.getUserById(m.user_id);
  if (u.data.user && !u.data.user.app_metadata.axiomotl_roles?.[site]) {
    actor = m.user_id;
    break;
  }
}
if (!actor) throw Error("No owner");
await mkdir(new URL("../../outputs/release-backups/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL(
    `../../outputs/release-backups/palette-${Date.now()}.json`,
    import.meta.url,
  ),
  JSON.stringify({ draft, publication: pub.data }),
);
if (!process.argv.includes("--publish")) {
  console.log({ validated: true, version: draft.version });
  process.exit(0);
}
const args = { p_site: site, p_actor: actor, p_document: document };
const saved = await db.rpc("owner_change", {
  ...args,
  p_action: "save",
  p_expected: draft.version,
});
if (saved.error) throw saved.error;
const published = await db.rpc("owner_change", {
  ...args,
  p_action: "publish",
  p_expected: saved.data.version,
});
if (published.error) throw published.error;
console.log({ published: true, version: published.data.version });
