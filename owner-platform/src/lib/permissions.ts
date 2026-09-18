import type { StaffRole } from "./types";
import { HttpError } from "./server/security";

// app_metadata can only be changed with the server's service credential.
// Membership is verified separately before this role is used.
export function roleForSite(
  metadata: Record<string, unknown>,
  siteId: string,
): StaffRole {
  const roles = metadata.axiomotl_roles as Record<string, unknown> | undefined;
  if (!roles || !Object.hasOwn(roles, siteId)) return "owner";
  return roles[siteId] === "publisher" ? "publisher" : "editor";
}
export function assertPermission(
  role: StaffRole,
  action: "publish" | "restore" | "staff",
) {
  if (role === "owner" || (role === "publisher" && action !== "staff")) return;
  throw new HttpError(
    403,
    action === "staff"
      ? "Only the site owner can manage staff."
      : "Your editor account can save drafts and preview. Ask a publisher to publish or restore.",
  );
}
