import { expect, test } from "vitest";
import { cn } from "./utils";

// text-caption/text-micro are theme font sizes; tailwind-merge must not read
// them as text colors and drop them next to one.
test("cn keeps the small-print size tokens next to a text color", () => {
  expect(cn("text-micro text-muted-foreground/70")).toBe(
    "text-micro text-muted-foreground/70",
  );
  expect(cn("text-caption text-primary")).toBe("text-caption text-primary");
  expect(cn("text-xs text-micro")).toBe("text-micro");
});
