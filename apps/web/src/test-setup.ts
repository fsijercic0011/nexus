import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library cannot clean up on its own.
afterEach(cleanup);

// jsdom's matchMedia never matches. Tests run at desktop width unless they set
// `setPhoneViewport(true)` (src/test/viewport.ts).
window.matchMedia = (query: string) =>
  ({
    matches:
      query.includes("max-width") &&
      (globalThis as { __mobile?: boolean }).__mobile === true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// jsdom has no ResizeObserver (used by Segmented to place its indicator).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
