import { useSyncExternalStore } from "react";

/** The phone breakpoint: below Tailwind's `md` (768px), where BottomNav
 * replaces the sidebar. Keep in sync with the `max-width: 767px` rules in
 * styles/theme.css. */
export const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True on phone-width screens, updating live as the window resizes. For
 * cases CSS breakpoints can't express -- rendering a different component
 * (cards instead of a table, a sheet instead of a popover). Prefer `md:`
 * classes for anything that is only styling. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
