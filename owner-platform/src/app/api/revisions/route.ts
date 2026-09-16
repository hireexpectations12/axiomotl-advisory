import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { HttpError } from "../../../lib/server/security";
export const GET = endpoint(async () => {
  const owner = await requireOwner();
  const { data, error } = await owner.client
    .from("revisions")
    .select("id,created_at,label,created_by")
    .eq("site_id", owner.siteId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(503, "Could not load revisions.");
  return Response.json({ revisions: data });
});
