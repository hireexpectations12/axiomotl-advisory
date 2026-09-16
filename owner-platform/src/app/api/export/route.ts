import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { getSite } from "../../../lib/server/site";
import { renderPage } from "../../../lib/render";
import { HttpError } from "../../../lib/server/security";
export const GET = endpoint(async () => {
  const owner = await requireOwner();
  const state = await getSite(owner);
  const { data: assets, error } = await owner.client
    .from("assets")
    .select("id,name,url,object_key,size")
    .eq("site_id", owner.siteId);
  if (error) throw new HttpError(503, "Could not export asset references.");
  const exported = {
    format: "axiomotl-site-export",
    exportedAt: new Date().toISOString(),
    ...state,
    assets,
    renderedPages: state.document.pages.map((page) => ({
      path: page.path,
      html: renderPage(state.document, page),
    })),
    mediaBackupNote:
      "Asset references are included. Back up the Supabase site-media bucket and bundled public/site-assets directory separately.",
  };
  return new Response(JSON.stringify(exported, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="axiomotl-site-export.json"',
    },
  });
});
