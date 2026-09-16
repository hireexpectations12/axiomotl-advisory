import { expect, it } from "vitest";
import { privateResponse, deploymentOrigin } from "../src/lib/server/security";
it("uses the exact preview deployment host while production keeps the canonical origin", () => {
  expect(
    deploymentOrigin({
      APP_URL: "https://axiomotl-advisory.vercel.app",
      VERCEL_ENV: "preview",
      VERCEL_URL: "axiomotl-test.vercel.app",
    }),
  ).toBe("https://axiomotl-test.vercel.app");
  expect(
    deploymentOrigin({
      APP_URL: "https://axiomotl-advisory.vercel.app",
      VERCEL_ENV: "production",
      VERCEL_URL: "axiomotl-test.vercel.app",
    }),
  ).toBe("https://axiomotl-advisory.vercel.app");
});
it("adds private cache headers to immutable redirects without losing location", () => {
  const result = privateResponse(
    Response.redirect("https://example.com/admin", 303),
  );
  expect(result.status).toBe(303);
  expect(result.headers.get("location")).toBe("https://example.com/admin");
  expect(result.headers.get("cache-control")).toBe("private, no-store");
});
