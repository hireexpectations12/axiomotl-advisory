import "server-only";
import { createClient } from "@supabase/supabase-js";
import baseline from "../../generated/baseline.json";
import { validateDocument, validateDraftDocument } from "../render";
import type { SiteDocument, SiteState } from "../types";
import { requireOwner } from "./supabase";
import { HttpError } from "./security";
import { assertPermission } from "../permissions";
type Owner = Awaited<ReturnType<typeof requireOwner>>;
export async function change(
  owner: Owner,
  action: string,
  version = 0,
  document?: SiteDocument,
  revision?: string,
): Promise<SiteState> {
  if (action === "publish" || action === "restore")
    assertPermission(owner.role, action);
  const { data, error } = await owner.service.rpc("owner_change", {
    p_site: owner.siteId,
    p_actor: owner.user.id,
    p_action: action,
    p_expected: version,
    p_document: document ?? null,
    p_revision: revision ?? null,
  });
  if (error)
    throw new HttpError(
      ["PT409", "40001"].includes(error.code)
        ? 409
        : error.code === "P0002"
          ? 404
          : 503,
      ["PT409", "40001"].includes(error.code)
        ? "Another session changed the draft. Reload before saving."
        : "The database could not complete this change.",
    );
  return { ...data, role: owner.role } as SiteState;
}
export async function getSite(owner: Owner): Promise<SiteState> {
  const { data, error } = await owner.client
    .from("drafts")
    .select("document,version")
    .eq("site_id", owner.siteId)
    .maybeSingle();
  if (error) throw new HttpError(503, "Could not load the draft.");
  if (!data) return change(owner, "seed", 0, validateDraftDocument(baseline));
  const { data: pub, error: pubError } = await owner.client
    .from("publications")
    .select("published_at")
    .eq("site_id", owner.siteId)
    .maybeSingle();
  if (pubError) throw new HttpError(503, "Could not load publication status.");
  return {
    document: validateDraftDocument(data.document),
    version: data.version,
    publishedAt: pub?.published_at ?? null,
    role: owner.role,
  };
}
export async function publish(owner: Owner, version: number) {
  const state = await getSite(owner);
  if (state.version !== version)
    throw new HttpError(409, "The draft changed. Reload before publishing.");
  const document = validateDocument(state.document);
  return change(owner, "publish", version, document);
}
export async function readPublished(): Promise<SiteDocument | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  );
  const { data, error } = await client.rpc("read_published", {
    p_site: process.env.SITE_ID || "00000000-0000-4000-8000-000000000001",
  });
  if (error)
    throw new HttpError(503, "Published website is temporarily unavailable.");
  return data ? validateDocument(data) : null;
}
