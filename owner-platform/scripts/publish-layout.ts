import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
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
  throw new Error(
    "Unpublished edits exist. Refusing to publish unrelated changes.",
  );
const marker = "/* Shared page rhythm;";
const css = await readFile(
  new URL("../design/combined/layout.css", import.meta.url),
  "utf8",
);
const next = structuredClone(draft.document);
const home = next.pages.find((p: { path: string }) => p.path === "/");
if (!home || home.project)
  throw new Error(
    "Home has editor structure; reconcile its styles before publishing.",
  );
const start = home.css.indexOf(marker);
home.css = `${start < 0 ? home.css : home.css.slice(0, start)}\n${css}`;
const document = validateDocument(next);
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
await mkdir(new URL("../../outputs/release-backups/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL(
    `../../outputs/release-backups/layout-${Date.now()}.json`,
    import.meta.url,
  ),
  JSON.stringify({ draft, publication: publication.data }),
);
if (!process.argv.includes("--publish"))
  console.log({ status: "validated", version: draft.version });
else {
  const saved = await db.rpc("owner_change", {
    p_site: site,
    p_actor: actor,
    p_action: "save",
    p_expected: draft.version,
    p_document: document,
  });
  if (saved.error)
    throw new Error("Draft save failed or changed in another session.");
  const published = await db.rpc("owner_change", {
    p_site: site,
    p_actor: actor,
    p_action: "publish",
    p_expected: saved.data.version,
    p_document: document,
  });
  if (published.error)
    throw new Error("Publish failed; the layout remains in the draft.");
  console.log({
    status: "published",
    version: published.data.version,
    publishedAt: published.data.publishedAt,
  });
}
