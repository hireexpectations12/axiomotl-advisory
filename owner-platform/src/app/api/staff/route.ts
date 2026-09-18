import { endpoint } from "../../../lib/server/http";
import { requireOwner, config } from "../../../lib/server/supabase";
import { HttpError, jsonBody } from "../../../lib/server/security";
import { assertPermission, roleForSite } from "../../../lib/permissions";
import { z } from "zod";

export const GET = endpoint(async () => {
  const owner = await requireOwner();
  assertPermission(owner.role, "staff");
  const { data, error } = await owner.service
    .from("memberships")
    .select("user_id")
    .eq("site_id", owner.siteId);
  if (error) throw new HttpError(503, "Could not load staff.");
  const staff = await Promise.all(
    (data || []).map(async (m) => {
      const { data, error } = await owner.service.auth.admin.getUserById(
        m.user_id,
      );
      if (error) throw new HttpError(503, "Could not load a staff account.");
      return {
        id: data.user.id,
        email: data.user.email,
        role: roleForSite(data.user.app_metadata, owner.siteId),
      };
    }),
  );
  return Response.json({ staff, currentUserId: owner.user.id });
});

export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  assertPermission(owner.role, "staff");
  const body = z
    .object({ email: z.email(), role: z.enum(["editor", "publisher"]) })
    .parse(await jsonBody(request));
  // generateLink creates an account without sending email. It will not reset an existing account.
  const { data, error } = await owner.service.auth.admin.generateLink({
    type: "invite",
    email: body.email,
    options: { redirectTo: new URL("/auth/callback", config().appUrl).href },
  });
  if (error || !data.user)
    throw new HttpError(
      400,
      "Could not create this staff account. If it already exists, ask the administrator to connect its site membership.",
    );
  const user = data.user;
  const { data: existing, error: memberReadError } = await owner.service
    .from("memberships")
    .select("user_id")
    .eq("site_id", owner.siteId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberReadError || existing)
    throw new HttpError(
      409,
      "This account already has access or its membership could not be verified. Refresh the staff list.",
    );
  const roles = {
    ...user.app_metadata.axiomotl_roles,
    [owner.siteId]: body.role,
  };
  const updated = await owner.service.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, axiomotl_roles: roles },
  });
  if (updated.error)
    throw new HttpError(
      503,
      "Could not set staff permissions. No membership was added.",
    );
  const member = await owner.service
    .from("memberships")
    .insert({ site_id: owner.siteId, user_id: user.id });
  if (member.error)
    throw new HttpError(
      503,
      "Account created but site access failed. Ask the administrator to connect it.",
    );
  const link = new URL("/auth/callback", config().appUrl);
  link.searchParams.set("token_hash", data.properties.hashed_token);
  link.searchParams.set("type", "invite");
  return Response.json({ setupUrl: link.href }, { status: 201 });
}, true);

export const PATCH = endpoint(async (request) => {
  const owner = await requireOwner();
  assertPermission(owner.role, "staff");
  const body = z
    .object({
      id: z.uuid(),
      role: z.enum(["editor", "publisher"]).optional(),
      remove: z.boolean().optional(),
    })
    .parse(await jsonBody(request));
  const { data: member, error } = await owner.service
    .from("memberships")
    .select("user_id")
    .eq("site_id", owner.siteId)
    .eq("user_id", body.id)
    .maybeSingle();
  if (error || !member) throw new HttpError(404, "Staff member not found.");
  const { data, error: userError } = await owner.service.auth.admin.getUserById(
    body.id,
  );
  if (userError) throw new HttpError(503, "Could not verify this account.");
  if (
    body.id === owner.user.id ||
    roleForSite(data.user.app_metadata, owner.siteId) === "owner"
  )
    throw new HttpError(
      403,
      "Owner accounts are protected. Contact the administrator for ownership changes.",
    );
  if (body.remove) {
    const result = await owner.service
      .from("memberships")
      .delete()
      .eq("site_id", owner.siteId)
      .eq("user_id", body.id);
    if (result.error) throw new HttpError(503, "Could not remove access.");
  } else {
    if (!body.role) throw new HttpError(400, "Choose a staff role.");
    const result = await owner.service.auth.admin.updateUserById(body.id, {
      app_metadata: {
        ...data.user.app_metadata,
        axiomotl_roles: {
          ...data.user.app_metadata.axiomotl_roles,
          [owner.siteId]: body.role,
        },
      },
    });
    if (result.error) throw new HttpError(503, "Could not update the role.");
  }
  return Response.json({ ok: true });
}, true);
