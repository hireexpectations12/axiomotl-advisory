import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

import { validateDocument, renderPage } from "../src/lib/render";

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
if (error || publication.error || !draft)
  throw new Error("Cannot read website state.");
if (JSON.stringify(draft.document) !== JSON.stringify(publication.data))
  throw new Error("Unpublished edits require reconciliation.");
const next = structuredClone(draft.document);
const home = next.pages.find((p: { path: string }) => p.path === "/");
if (!home) throw new Error("Home page missing.");
const source = new URL("../design/combined/", import.meta.url);
const read = (name: string) => readFile(new URL(name, source), "utf8");
// CSS-only publication preserves the current content and all form definitions.
if (home.project)
  throw new Error(
    "Editor state requires reconciliation before CSS publication.",
  );
const css = await read("hero-blend.css");
if (home.css.includes("/* Hero edge blend:"))
  throw new Error("Hero blend is already applied.");
home.css += "\n" + css;
const document = validateDocument(next);
const directory = new URL("../../outputs/release-backups/", import.meta.url);
await mkdir(directory, { recursive: true });
const reviewPath = new URL("hero-blend-review.json", directory);
if (!process.argv.includes("--publish")) {
  await writeFile(
    reviewPath,
    JSON.stringify({ version: draft.version, document }),
  );
  await writeFile(
    new URL("../public/hero-blend-preview.html", import.meta.url),
    renderPage(document, { ...document.pages[0], noIndex: true }),
  );
  console.log({
    status: "prepared",
    version: draft.version,
    preservedForms: document.forms.length,
  });
} else {
  const reviewed = JSON.parse(await readFile(reviewPath, "utf8"));
  if (
    reviewed.version !== draft.version ||
    JSON.stringify(reviewed.document) !== JSON.stringify(document)
  )
    throw new Error("Website or candidate changed since review.");
  await writeFile(
    new URL(`hero-blend-before-${Date.now()}.json`, directory),
    JSON.stringify({ draft, publication: publication.data }),
  );
  const membership = await db
    .from("memberships")
    .select("user_id")
    .eq("site_id", site);
  if (membership.error) throw new Error("Cannot verify owner.");
  let actor;
  for (const member of membership.data || []) {
    const user = await db.auth.admin.getUserById(member.user_id);
    if (user.data.user && !user.data.user.app_metadata.axiomotl_roles?.[site]) {
      actor = member.user_id;
      break;
    }
  }
  if (!actor) throw new Error("No protected owner found.");
  const args = {
    p_site: site,
    p_actor: actor,
    p_expected: draft.version,
    p_document: document,
  };
  const saved = await db.rpc("owner_change", { ...args, p_action: "save" });
  if (saved.error)
    throw new Error("Draft save failed or concurrent edit detected.");
  const published = await db.rpc("owner_change", {
    ...args,
    p_action: "publish",
    p_expected: saved.data.version,
  });
  if (published.error)
    throw new Error("Publication failed; changes remain in draft.");
  console.log({
    status: "published",
    version: published.data.version,
    publishedAt: published.data.publishedAt,
  });
}
