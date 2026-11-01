import { describe, expect, it } from "vitest";
import { logSafeUrl } from "../src/infrastructure/logging.js";

describe("request logging", () => {
  it("drops the query string, which can carry OAuth codes", () => {
    expect(
      logSafeUrl("/api/auth/callback/google?code=4%2Fsecret&state=abc"),
    ).toBe("/api/auth/callback/google");
  });

  it("keeps a URL without a query as is", () => {
    expect(logSafeUrl("/api/me")).toBe("/api/me");
  });
});
