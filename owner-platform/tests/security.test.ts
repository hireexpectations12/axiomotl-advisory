import { describe, it, expect } from "vitest";
import {
  assertOrigin,
  detectImage,
  parseVersion,
} from "../src/lib/server/security";
describe("request boundaries", () => {
  it("rejects absent and foreign origins even if host is spoofed", () => {
    for (const origin of [
      null,
      "null",
      "https://evil.test",
      "https://owner.test.evil.test",
    ]) {
      expect(() =>
        assertOrigin(
          new Request("https://owner.test/api/site", {
            headers: origin ? { origin } : {},
          }),
          "https://owner.test",
        ),
      ).toThrow();
    }
    expect(() =>
      assertOrigin(
        new Request("https://owner.test/api/site", {
          headers: { origin: "https://owner.test" },
        }),
        "https://owner.test",
      ),
    ).not.toThrow();
  });
  it("requires safe integer versions", () => {
    for (const value of [-1, 1.5, "1", NaN, Number.MAX_SAFE_INTEGER + 1])
      expect(() => parseVersion(value)).toThrow();
    expect(parseVersion(0)).toBe(0);
  });
  it("detects bytes rather than trusting a filename or claimed mime type", () => {
    expect(
      detectImage(
        Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
      ),
    ).toEqual({ mime: "image/png", extension: "png" });
    expect(() =>
      detectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),
    ).toThrow();
    expect(() => detectImage(new Uint8Array(4 * 1024 * 1024 + 1))).toThrow();
    expect(() => detectImage(new Uint8Array())).toThrow();
  });
});
