import "server-only";
import type { requireOwner } from "./supabase";
import { HttpError } from "./security";
import { reduceEnquiry, type EnquiryEvent } from "../enquiries";
type Owner = Awaited<ReturnType<typeof requireOwner>>;
export const ENQUIRY_BUCKET = "owner-enquiries";
export async function enquiryStore(owner: Owner) {
  const { data, error } = await owner.service.storage.getBucket(ENQUIRY_BUCKET);
  if (error || !data || data.public)
    throw new HttpError(
      503,
      "Private enquiry storage is unavailable. Contact the administrator.",
    );
  return owner.service.storage.from(ENQUIRY_BUCKET);
}
export async function readEnquiry(owner: Owner, id: string) {
  const store = await enquiryStore(owner);
  const events: EnquiryEvent[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await store.list(`${owner.siteId}/${id}`, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new HttpError(503, "Could not load enquiry history.");
    for (const object of data || []) {
      const result = await store.download(
        `${owner.siteId}/${id}/${object.name}`,
      );
      if (result.error)
        throw new HttpError(503, "Could not read an enquiry update.");
      events.push(JSON.parse(await result.data.text()));
    }
    if (!data || data.length < 100) break;
  }
  return reduceEnquiry(id, events);
}
export async function appendEnquiry(
  owner: Owner,
  id: string,
  event: Omit<EnquiryEvent, "id" | "at" | "actor">,
) {
  const store = await enquiryStore(owner);
  const record = {
    ...event,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: owner.user.email || owner.user.id,
  };
  const { error } = await store.upload(
    `${owner.siteId}/${id}/${record.id}.json`,
    JSON.stringify(record),
    { contentType: "application/json", upsert: false },
  );
  if (error)
    throw new HttpError(
      503,
      "Could not save the enquiry. Your entry remains on screen.",
    );
}
