import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  role: "editor",
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/server/supabase", () => ({
  config: () => ({ appUrl: "https://example.com" }),
  requireOwner: async () => ({
    role: mock.role,
    siteId: "site",
    user: { id: "actor" },
    service: { from: mock.from, rpc: mock.rpc },
    client: {},
  }),
}));
import { GET, POST, PATCH } from "../src/app/api/staff/route";
import { change } from "../src/lib/server/site";
beforeEach(() => {
  mock.role = "editor";
  mock.from.mockReset();
  mock.rpc.mockReset();
});
it("denies staff enumeration and mutations to editors and publishers before database access", async () => {
  for (const role of ["editor", "publisher"]) {
    mock.role = role;
    expect(
      (await GET(new Request("https://example.com/api/staff"))).status,
    ).toBe(403);
    for (const handler of [POST, PATCH])
      expect(
        (
          await handler(
            new Request("https://example.com/api/staff", {
              method: "POST",
              headers: {
                Origin: "https://example.com",
                "Content-Type": "application/json",
              },
              body: "{}",
            }),
          )
        ).status,
      ).toBe(403);
  }
  expect(mock.from).not.toHaveBeenCalled();
});
it("prevents editor publication and restore at the server mutation boundary", async () => {
  const { requireOwner } = await import("../src/lib/server/supabase");
  const owner = await requireOwner();
  for (const action of ["publish", "restore"])
    await expect(change(owner, action)).rejects.toMatchObject({ status: 403 });
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("rejects cross-origin staff requests", async () => {
  mock.role = "owner";
  expect(
    (
      await POST(
        new Request("https://example.com/api/staff", {
          method: "POST",
          headers: { Origin: "https://untrusted.example" },
        }),
      )
    ).status,
  ).toBe(403);
  expect(mock.from).not.toHaveBeenCalled();
});
