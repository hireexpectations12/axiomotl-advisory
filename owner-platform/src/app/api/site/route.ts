import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { change, getSite } from "../../../lib/server/site";
import {
  HttpError,
  jsonBody,
  parseVersion,
} from "../../../lib/server/security";
import { validateDraftDocument } from "../../../lib/render";
export const GET = endpoint(async () =>
  Response.json(await getSite(await requireOwner())),
);
export const PUT = endpoint(async (request) => {
  const owner = await requireOwner();
  const body = await jsonBody(request);
  const version = parseVersion(body.version);
  if ((await getSite(owner)).version !== version)
    throw new HttpError(
      409,
      "Another session changed the draft. Reload before saving.",
    );
  return Response.json(
    await change(owner, "save", version, validateDraftDocument(body.document)),
  );
}, true);
