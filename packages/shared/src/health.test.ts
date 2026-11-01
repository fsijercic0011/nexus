import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("parses a healthy response", () => {
    const input = { status: "ok", database: "ok" };
    expect(healthResponseSchema.parse(input)).toEqual(input);
  });

  it("rejects an unknown status", () => {
    expect(
      healthResponseSchema.safeParse({ status: "fine", database: "ok" })
        .success,
    ).toBe(false);
  });
});
