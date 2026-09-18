import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { getSite } from "../../../lib/server/site";
import { checkSiteLinks } from "../../../lib/site-health";
import { validateForm } from "../../../lib/forms";
export const GET = endpoint(async () => {
  const state = await getSite(await requireOwner());
  return Response.json({
    checkedAt: new Date().toISOString(),
    publishedAt: state.publishedAt,
    version: state.version,
    role: state.role,
    email: "On hold — online submission and email notifications are disabled",
    links: checkSiteLinks(state.document),
    forms: state.document.forms.map((form) => ({
      name: form.name,
      ...validateForm(form),
    })),
  });
});
