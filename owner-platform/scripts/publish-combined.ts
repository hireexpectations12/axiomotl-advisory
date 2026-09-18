import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { validateDocument } from "../src/lib/render";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const site = process.env.SITE_ID || "00000000-0000-4000-8000-000000000001";
const { data: draft, error } = await db.from("drafts").select("document,version").eq("site_id", site).single();
if (error || !draft) throw new Error("Cannot read current draft");
const { data: publication, error: pubError } = await db.rpc("read_published", { p_site: site });
if (pubError) throw new Error("Cannot read publication");
if (JSON.stringify(draft.document.pages.find((p: {path:string}) => p.path === "/")) !== JSON.stringify(publication.pages.find((p: {path:string}) => p.path === "/"))) {
  throw new Error("Unpublished home-page edits need reconciliation before release");
}
const approved = JSON.parse(await readFile(new URL("../src/generated/combined.json", import.meta.url), "utf8"));
// Preserve current form mappings, additional pages and business settings.
const merged = validateDocument({
  ...draft.document,
  settings: { ...draft.document.settings, font: approved.settings.font, background: approved.settings.background, foreground: approved.settings.foreground, accent: approved.settings.accent, logo: approved.settings.logo, favicon: approved.settings.favicon },
  pages: draft.document.pages.map((page: {path:string;id:string}) => page.path === "/" ? { ...approved.pages[0], id: page.id } : page),
});
await mkdir(new URL("../../outputs/release-backups/", import.meta.url), { recursive: true });
await writeFile(new URL(`../../outputs/release-backups/before-${Date.now()}.json`, import.meta.url), JSON.stringify({ draft, publication }, null, 2));
const { data: owners, error: ownerError } = await db.from("memberships").select("user_id").eq("site_id", site);
if (ownerError || !owners?.length) throw new Error("No site owner found");
if (!process.argv.includes("--publish")) {
  console.log({ status: "validated", version: draft.version, preservedForms: merged.forms.length, pages: merged.pages.length });
} else {
  const args = { p_site: site, p_actor: owners[0].user_id, p_expected: draft.version, p_document: merged };
  const saved = await db.rpc("owner_change", { ...args, p_action: "save" });
  if (saved.error) throw new Error(`Save rejected: ${saved.error.code}`);
  const published = await db.rpc("owner_change", { ...args, p_action: "publish", p_expected: saved.data.version });
  if (published.error) throw new Error(`Publish rejected: ${published.error.code}`);
  console.log({ status: "published", version: published.data.version, publishedAt: published.data.publishedAt, preservedForms: merged.forms.length });
}
