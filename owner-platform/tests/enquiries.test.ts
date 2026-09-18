import { expect, it } from "vitest";
import {
  reduceEnquiry,
  enquiryInput,
  type EnquiryEvent,
} from "../src/lib/enquiries";
it("keeps concurrent notes and applies status changes without discarding the original enquiry", () => {
  const events: EnquiryEvent[] = [
    {
      id: "1",
      at: "2026-09-19T00:00:00Z",
      actor: "owner",
      create: {
        name: "Client",
        email: "client@example.com",
        organisation: "",
        message: "Please call",
        source: "email",
      },
    },
    {
      id: "2",
      at: "2026-09-19T00:01:00Z",
      actor: "a",
      note: "Called client",
      status: "in_progress",
    },
    { id: "3", at: "2026-09-19T00:01:00Z", actor: "b", note: "Sent proposal" },
  ];
  const item = reduceEnquiry("lead", events);
  expect(item?.name).toBe("Client");
  expect(item?.status).toBe("in_progress");
  expect(item?.notes).toHaveLength(2);
});
it("rejects malformed or oversized enquiries", () => {
  expect(
    enquiryInput.safeParse({
      name: "",
      email: "invalid",
      message: "x".repeat(5000),
      source: "email",
    }).success,
  ).toBe(false);
});
