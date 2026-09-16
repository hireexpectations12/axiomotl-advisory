import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { HttpError, jsonBody } from "../../../lib/server/security";
export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  const body = await jsonBody(request);
  if (
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    body.password.length > 128
  )
    throw new HttpError(400, "Use a password between 12 and 128 characters.");
  const { error } = await owner.client.auth.updateUser({
    password: body.password,
  });
  if (error)
    throw new HttpError(
      400,
      "Could not update your password. Request a fresh recovery link.",
    );
  return Response.json({ ok: true });
}, true);
