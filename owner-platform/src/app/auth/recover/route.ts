import { endpoint } from "../../../lib/server/http";
import { sessionClient, config } from "../../../lib/server/supabase";
import { HttpError, jsonBody } from "../../../lib/server/security";
export const POST = endpoint(async (request) => {
  const body = await jsonBody(request);
  if (
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !body.email.includes("@")
  )
    throw new HttpError(400, "Enter your email address.");
  const client = await sessionClient();
  const { error } = await client.auth.resetPasswordForEmail(body.email, {
    redirectTo: new URL("/auth/callback?next=recovery", config().appUrl).href,
  });
  if (error)
    throw new HttpError(
      429,
      "Recovery is temporarily unavailable. Wait a moment and try again.",
    );
  return Response.json({
    ok: true,
    message:
      "If this address has an account, a recovery email will arrive shortly.",
  });
}, true);
