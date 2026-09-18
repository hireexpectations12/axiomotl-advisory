import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { HttpError, deploymentOrigin } from "./security";
import { roleForSite } from "../permissions";

export function config() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = deploymentOrigin(process.env);
  if (!url || !anon || !serviceKey || !appUrl)
    throw new HttpError(
      503,
      "Owner platform is not configured. Set the Supabase credentials and APP_URL.",
    );
  return {
    url,
    anon,
    serviceKey,
    appUrl,
    siteId: process.env.SITE_ID || "00000000-0000-4000-8000-000000000001",
  };
}
export function serviceClient() {
  const { url, serviceKey } = config();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function sessionClient() {
  const { url, anon } = config();
  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          jar.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
      },
    },
  });
}
export async function requireOwner() {
  const client = await sessionClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user)
    throw new HttpError(401, "Sign in to access the owner workspace.");
  const { siteId } = config();
  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("user_id")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError)
    throw new HttpError(503, "Could not verify site access. Try again.");
  if (!membership)
    throw new HttpError(403, "This account is not an owner of this site.");
  return {
    client,
    user,
    siteId,
    service: serviceClient(),
    role: roleForSite(user.app_metadata, siteId),
  };
}
