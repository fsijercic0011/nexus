import { describe, expect, it } from "vitest";

// Guards the "one unified look" rule and the de-branding of the kit ported
// from Imperior: components use theme tokens only, and nothing of Imperior's
// brand or translation layer survives.
const sources = import.meta.glob<string>(
  ["./**/*.{ts,tsx,css}", "!./**/*.test.{ts,tsx}", "!./styles/theme.css"],
  { query: "?raw", import: "default", eager: true },
);

const theme = import.meta.glob<string>("./styles/theme.css", {
  query: "?raw",
  import: "default",
  eager: true,
})["./styles/theme.css"];

const forbidden: [string, RegExp][] = [
  ["hex colour", /#[0-9a-fA-F]{3,8}\b/],
  ["rgb() colour", /\brgba?\(/],
  ["arbitrary px text size", /text-\[\d+px\]/],
  ["i18n import", /@\/i18n/],
  ["Imperior/FLOW reference", /Imperior|FLOW\b/],
  ["brand token", /--brand/],
];

describe("kit hygiene", () => {
  it("finds source files to check", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
  });

  for (const [label, pattern] of forbidden) {
    it(`has no ${label} outside the theme`, () => {
      const offenders = Object.entries(sources)
        .filter(([, text]) => pattern.test(text))
        .map(([path]) => path);
      expect(offenders).toEqual([]);
    });
  }

  it("keeps Imperior's brand surfaces out of the theme", () => {
    expect(theme).toBeDefined();
    for (const token of ["--brand", "app-backdrop", "card-from"]) {
      expect(theme).not.toContain(token);
    }
  });
});
