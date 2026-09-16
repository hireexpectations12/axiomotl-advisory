import { endpoint } from "../../../lib/server/http";
import { sessionClient } from "../../../lib/server/supabase";
import { HttpError } from "../../../lib/server/security";
export const POST = endpoint(async () => {
  const client = await sessionClient();
  const { error } = await client.auth.signOut();
  if (error) throw new HttpError(503, "Sign-out failed. Try again.");
  return Response.json({ ok: true });
}, true);
