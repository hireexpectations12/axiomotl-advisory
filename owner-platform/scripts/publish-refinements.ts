import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
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
const $ = load(home.html, null, false);
if ($("#starting-point").length !== 1 || $("#sectors").length !== 1)
  throw new Error("Expected sections missing.");
if (!next.forms.some((form: { id: string }) => form.id === "journey"))
  throw new Error("Assessment definition missing.");
$("#starting-point").replaceWith(await read("finder.html"));
$("#sectors").replaceWith(await read("industry.html"));
home.html = $.html();
// Re-import the updated canonical HTML/CSS on the next editor open. Keeping
// the previous GrapesJS snapshot would silently restore the replaced sections.
// The complete previous editor project is retained in the release backup.
home.project = null;
const marker = "/* September 2026: compact services";
if (home.css.includes(marker))
  throw new Error(
    "Refinements are already applied; reconcile later styles before republishing.",
  );
home.css += "\n" + (await read("refinements.css"));
const document = validateDocument(next);
const directory = new URL("../../outputs/release-backups/", import.meta.url);
await mkdir(directory, { recursive: true });
const reviewPath = new URL("refinements-review.json", directory);
if (!process.argv.includes("--publish")) {
  await writeFile(
    reviewPath,
    JSON.stringify({ version: draft.version, document }),
  );
  await writeFile(
    new URL("../public/refinement-preview.html", import.meta.url),
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
    new URL(`refinements-before-${Date.now()}.json`, directory),
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
