import { expect, it } from "vitest";
import { roleForSite, assertPermission } from "../src/lib/permissions";
it("keeps existing owners and uses only the selected site's staff role", () => {
  expect(roleForSite({}, "site-a")).toBe("owner");
  expect(
    roleForSite(
      { axiomotl_roles: { "site-a": "editor", "site-b": "publisher" } },
      "site-a",
    ),
  ).toBe("editor");
  expect(
    roleForSite({ axiomotl_roles: { "site-a": "invalid" } }, "site-a"),
  ).toBe("editor");
});
it("editors cannot publish, restore or manage staff; publishers cannot manage staff", () => {
  for (const action of ["publish", "restore", "staff"] as const)
    expect(() => assertPermission("editor", action)).toThrow();
  expect(() => assertPermission("publisher", "publish")).not.toThrow();
  expect(() => assertPermission("publisher", "staff")).toThrow();
  expect(() => assertPermission("owner", "staff")).not.toThrow();
});
