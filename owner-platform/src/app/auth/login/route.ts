import { endpoint } from "../../../lib/server/http";
import { sessionClient, requireOwner } from "../../../lib/server/supabase";
import { HttpError, jsonBody } from "../../../lib/server/security";
export const POST = endpoint(async (request) => {
  const body = await jsonBody(request);
  if (typeof body.email !== "string" || typeof body.password !== "string")
    throw new HttpError(400, "Email and password are required.");
  const client = await sessionClient();
  const { error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error)
    throw new HttpError(401, "Sign-in failed. Check your email and password.");
  try {
    await requireOwner();
  } catch (error) {
    await client.auth.signOut();
    throw error;
  }
  return Response.json({ ok: true });
}, true);
