import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import { enquiryInput, enquiryUpdate } from "../../../lib/enquiries";
import {
  enquiryStore,
  appendEnquiry,
  readEnquiry,
} from "../../../lib/server/enquiries";
import { HttpError, jsonBody } from "../../../lib/server/security";

export const GET = endpoint(async (request) => {
  const owner = await requireOwner();
  const store = await enquiryStore(owner);
  const offset = Number(new URL(request.url).searchParams.get("offset") || 0);
  if (!Number.isSafeInteger(offset) || offset < 0)
    throw new HttpError(400, "Invalid page.");
  const { data, error } = await store.list(owner.siteId, {
    limit: 20,
    offset,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new HttpError(503, "Could not load enquiries.");
  const enquiries = (
    await Promise.all((data || []).map((item) => readEnquiry(owner, item.name)))
  ).filter(Boolean);
  const members = await owner.service
    .from("memberships")
    .select("user_id")
    .eq("site_id", owner.siteId);
  if (members.error)
    throw new HttpError(503, "Could not load assignment choices.");
  const staff = await Promise.all(
    (members.data || []).map(async (member) => {
      const result = await owner.service.auth.admin.getUserById(member.user_id);
      return {
        id: member.user_id,
        email: result.data.user?.email || "Staff member",
      };
    }),
  );
  return Response.json({ enquiries, staff, hasMore: data?.length === 20 });
});
export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  const input = enquiryInput.parse(await jsonBody(request));
  const id = crypto.randomUUID();
  await appendEnquiry(owner, id, { create: input });
  return Response.json({ id }, { status: 201 });
}, true);
export const PATCH = endpoint(async (request) => {
  const owner = await requireOwner();
  const { id, ...input } = enquiryUpdate.parse(await jsonBody(request));
  if (!(await readEnquiry(owner, id)))
    throw new HttpError(404, "Enquiry not found.");
  if (input.assignee) {
    const { data, error } = await owner.service
      .from("memberships")
      .select("user_id")
      .eq("site_id", owner.siteId)
      .eq("user_id", input.assignee)
      .maybeSingle();
    if (error || !data)
      throw new HttpError(400, "Choose a current staff member.");
  }
  await appendEnquiry(owner, id, input);
  return Response.json({ ok: true });
}, true);
