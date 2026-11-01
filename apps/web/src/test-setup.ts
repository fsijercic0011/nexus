import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia. Tests run at desktop width unless they set
// `globalThis.__mobile = true` (see setViewport in test-utils).
if (!window.matchMedia) {
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
}
