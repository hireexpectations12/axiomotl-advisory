import { endpoint } from "../../../lib/server/http";
import {
  sessionClient,
  config,
  requireOwner,
} from "../../../lib/server/supabase";
import { HttpError } from "../../../lib/server/security";
export const GET = endpoint(async (request) => {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const token = params.get("token_hash");
  const client = await sessionClient();
  const result = code
    ? await client.auth.exchangeCodeForSession(code)
    : token && ["invite", "recovery"].includes(params.get("type") || "")
      ? await client.auth.verifyOtp({
          token_hash: token,
          type: params.get("type") as "invite" | "recovery",
        })
      : null;
  if (!result || result.error)
    throw new HttpError(
      401,
      "This sign-in link is invalid or expired. Request a new recovery email.",
    );
  try {
    await requireOwner();
  } catch (error) {
    await client.auth.signOut();
    throw error;
  }
  return Response.redirect(new URL("/admin?recovery=1", config().appUrl), 303);
});
