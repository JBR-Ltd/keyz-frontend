import { describe, expect, it } from "vitest";
import { loginPath, registerPath, safeReturnTo } from "../authContinuation";

describe("safeReturnTo", () => {
  it("preserves internal paths, queries and fragments", () => {
    expect(safeReturnTo("/browse?search=14#results")).toBe(
      "/browse?search=14#results",
    );
  });

  it.each([
    "https://example.com/steal-session",
    "//example.com/steal-session",
    "javascript:alert(1)",
  ])("rejects unsafe destination %s", (destination) => {
    expect(safeReturnTo(destination)).toBe("/browse");
  });
});

describe("authentication continuation paths", () => {
  it("encodes the validated return destination", () => {
    expect(loginPath("/property/best-home-p_123?action=rent")).toBe(
      "/login?returnTo=%2Fproperty%2Fbest-home-p_123%3Faction%3Drent",
    );
    expect(registerPath("/browse?search=4")).toBe(
      "/register?role=TENANT&returnTo=%2Fbrowse%3Fsearch%3D4",
    );
  });
});
