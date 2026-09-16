import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { change } from "../../../lib/server/site";
import {
  HttpError,
  jsonBody,
  parseVersion,
} from "../../../lib/server/security";
export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  const body = await jsonBody(request);
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
    throw new HttpError(400, "A revision ID is required.");
  return Response.json(
    await change(
      owner,
      "restore",
      parseVersion(body.version),
      undefined,
      body.id,
    ),
  );
}, true);
