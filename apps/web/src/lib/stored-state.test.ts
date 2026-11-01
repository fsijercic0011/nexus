import { describe, expect, test } from "vitest";
import {
  isBoolean,
  isStringArray,
  oneOf,
  readStored,
  userStorageKey,
  writeStored,
} from "./stored-state";

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}
const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};
const region = oneOf(["nl", "usa"] as const);

test("keys are scoped per user", () => {
  expect(userStorageKey("u7", "rail")).toBe("nexus:u7:rail");
  expect(userStorageKey("u8", "rail")).not.toBe(userStorageKey("u7", "rail"));
});

describe("readStored", () => {
  test("returns a stored value that validates", () => {
    expect(
      readStored(
        memoryStorage({ k: JSON.stringify("usa") }),
        "k",
        "nl",
        region,
      ),
    ).toBe("usa");
  });
  test.each([
    ["missing", memoryStorage()],
    ["invalid JSON", memoryStorage({ k: "{nope" })],
    ["failing validation", memoryStorage({ k: JSON.stringify("de") })],
    ["throwing storage", throwing],
    ["no storage", undefined],
  ])("falls back when %s", (_label, storage) => {
    expect(readStored(storage, "k", "nl", region)).toBe("nl");
  });
});

describe("writeStored", () => {
  test("stores JSON", () => {
    const storage = memoryStorage();
    writeStored(storage, "k", ["a"]);
    expect(storage.data.k).toBe('["a"]');
  });
  test("swallows a throwing or missing storage", () => {
    expect(() => writeStored(throwing, "k", true)).not.toThrow();
    expect(() => writeStored(undefined, "k", true)).not.toThrow();
  });
});

test("validators", () => {
  expect(isBoolean(false)).toBe(true);
  expect(isBoolean("false")).toBe(false);
  expect(isStringArray(["a"])).toBe(true);
  expect(isStringArray(["a", 1])).toBe(false);
  expect(isStringArray("a")).toBe(false);
});
