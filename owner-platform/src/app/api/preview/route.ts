import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { getSite } from "../../../lib/server/site";
import { renderPreview } from "../../../lib/preview";
import { HttpError } from "../../../lib/server/security";
export const GET = endpoint(async (request) => {
  const { document } = await getSite(await requireOwner());
  const params = new URL(request.url).searchParams;
  const page = document.pages.find((p) =>
    params.has("page")
      ? p.id === params.get("page")
      : p.path === (params.get("path") || "/"),
  );
  if (!page) throw new HttpError(404, "Page not found.");
  const { html, headers } = await renderPreview(document, page);
  return new Response(html, { headers });
});
