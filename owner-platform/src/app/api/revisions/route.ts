import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { HttpError } from "../../../lib/server/security";
export const GET = endpoint(async () => {
  const owner = await requireOwner();
  const { data, error } = await owner.client
    .from("revisions")
    .select("id,created_at,label,created_by,document")
    .eq("site_id", owner.siteId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(503, "Could not load revisions.");
  const names = new Map<string, string>();
  for (const id of new Set((data || []).map((r) => r.created_by))) {
    const result = await owner.service.auth.admin.getUserById(id);
    names.set(id, result.data.user?.email || "Former staff member");
  }
  const revisions = (data || []).map((r, index) => {
    const previous = data?.[index + 1]?.document;
    const parts = previous
      ? [
          JSON.stringify(r.document.settings) !==
          JSON.stringify(previous.settings)
            ? "Site settings"
            : "",
          JSON.stringify(r.document.pages) !== JSON.stringify(previous.pages)
            ? "Pages"
            : "",
          JSON.stringify(r.document.forms) !== JSON.stringify(previous.forms)
            ? "Form mappings"
            : "",
        ].filter(Boolean)
      : [];
    return {
      id: r.id,
      label: r.label,
      created_at: r.created_at,
      created_by: names.get(r.created_by),
      summary: previous
        ? parts.length
          ? `Changed: ${parts.join(", ")}`
          : "No content changes from the preceding revision"
        : "Initial saved version",
    };
  });
  return Response.json({ revisions });
});
