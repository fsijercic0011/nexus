import { describe, expect, it } from "vitest";
import {
  isSignupAllowed,
  normalizeEmail,
} from "../src/modules/auth/allowlist.js";

describe("sign-up allowlist", () => {
  it("matches regardless of case and surrounding whitespace", () => {
    expect(isSignupAllowed(" Owner@Example.com ", ["owner@example.com"])).toBe(
      true,
    );
  });

  it("refuses an email that is not listed", () => {
    expect(isSignupAllowed("other@example.com", ["owner@example.com"])).toBe(
      false,
    );
  });

  it("refuses everyone when the list is empty", () => {
    expect(isSignupAllowed("owner@example.com", [])).toBe(false);
  });

  it("normalizes to trimmed lower case", () => {
    expect(normalizeEmail("  Owner@Example.COM\t")).toBe("owner@example.com");
  });
});
