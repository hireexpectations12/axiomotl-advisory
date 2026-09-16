import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { publish } from "../../../lib/server/site";
import { jsonBody, parseVersion } from "../../../lib/server/security";
export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  const body = await jsonBody(request);
  return Response.json(await publish(owner, parseVersion(body.version)));
}, true);
