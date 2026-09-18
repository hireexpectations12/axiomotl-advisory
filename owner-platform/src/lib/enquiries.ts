import { z } from "zod";
export const enquiryInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.union([z.literal(""), z.email()]),
  organisation: z.string().max(160),
  message: z.string().trim().min(1).max(4000),
  source: z.enum(["email", "phone", "other"]),
});
export const enquiryUpdate = z.object({
  id: z.uuid(),
  status: z.enum(["new", "in_progress", "closed"]).optional(),
  assignee: z.union([z.literal(""), z.uuid()]).optional(),
  note: z.string().trim().max(2000).optional(),
});
export type EnquiryEvent = {
  id: string;
  at: string;
  actor: string;
  create?: z.infer<typeof enquiryInput>;
  status?: string;
  assignee?: string;
  note?: string;
};
export type Enquiry = z.infer<typeof enquiryInput> & {
  id: string;
  createdAt: string;
  status: string;
  assignee: string;
  notes: { at: string; actor: string; text: string }[];
};
export function reduceEnquiry(
  id: string,
  events: EnquiryEvent[],
): Enquiry | null {
  const ordered = [...events].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
  const initial = ordered.find((e) => e.create);
  if (!initial?.create) return null;
  const result: Enquiry = {
    ...initial.create,
    id,
    createdAt: initial.at,
    status: "new",
    assignee: "",
    notes: [],
  };
  for (const e of ordered) {
    if (e.status !== undefined) result.status = e.status;
    if (e.assignee !== undefined) result.assignee = e.assignee;
    if (e.note) result.notes.push({ at: e.at, actor: e.actor, text: e.note });
  }
  return result;
}
