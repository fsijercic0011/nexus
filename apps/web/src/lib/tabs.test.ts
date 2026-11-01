import { describe, expect, it } from "vitest";
import { nextTabIndex } from "./tabs";

describe("nextTabIndex", () => {
  it("wraps arrows around the ends", () => {
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextTabIndex(2, "ArrowRight", 3)).toBe(0);
  });
  it("jumps with Home and End", () => {
    expect(nextTabIndex(1, "Home", 3)).toBe(0);
    expect(nextTabIndex(0, "End", 3)).toBe(2);
  });
  it("ignores other keys", () => {
    expect(nextTabIndex(0, "a", 3)).toBeNull();
  });
});
