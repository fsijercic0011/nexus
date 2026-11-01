import { expect, test } from "vitest";
import { ErrorBoundary } from "./error-boundary";

test("a failed boundary resets when its reset key changes, and only then", () => {
  expect(
    ErrorBoundary.getDerivedStateFromProps(
      { resetKey: "/b", children: null },
      { failed: true, resetKey: "/a" },
    ),
  ).toEqual({ failed: false, resetKey: "/b" });
  expect(
    ErrorBoundary.getDerivedStateFromProps(
      { resetKey: "/a", children: null },
      { failed: true, resetKey: "/a" },
    ),
  ).toBeNull();
});
