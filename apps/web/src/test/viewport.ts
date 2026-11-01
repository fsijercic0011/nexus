import { afterEach } from "vitest";

/** Renders the next components at phone (true) or desktop (false) width,
 * through the matchMedia stub in test-setup.ts. */
export function setPhoneViewport(phone: boolean): void {
  (globalThis as { __mobile?: boolean }).__mobile = phone;
}

afterEach(() => setPhoneViewport(false));
