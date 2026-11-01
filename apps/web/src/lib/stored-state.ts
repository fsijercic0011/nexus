// Remembered UI state (filters, panel open, the sidebar rail). A convenience
// only: storage can be blocked or hold stale values, so every read is
// validated and falls back to the default, and a failed write keeps the
// choice for this visit. Keys are per signed-in user, so a shared computer
// doesn't carry one person's filters into another's session.

export type Validate<T> = (raw: unknown) => raw is T;

export function userStorageKey(userId: string, name: string): string {
  return `nexus:${userId}:${name}`;
}

export function readStored<T>(
  storage: Pick<Storage, "getItem"> | undefined,
  key: string,
  fallback: T,
  validate: Validate<T>,
): T {
  try {
    const raw = storage?.getItem(key);
    if (raw == null) return fallback;
    const value: unknown = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(
  storage: Pick<Storage, "setItem"> | undefined,
  key: string,
  value: unknown,
): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Not remembered; the in-memory value still applies for this visit.
  }
}

export const isBoolean: Validate<boolean> = (raw): raw is boolean =>
  typeof raw === "boolean";

export function oneOf<T extends string>(values: readonly T[]): Validate<T> {
  return (raw): raw is T =>
    typeof raw === "string" && (values as readonly string[]).includes(raw);
}

export const isStringArray: Validate<string[]> = (raw): raw is string[] =>
  Array.isArray(raw) && raw.every((item) => typeof item === "string");

export type StorageArea = "local" | "session";

/** The browser storage for `area`, or undefined where touching it throws. */
export function browserStorage(area: StorageArea): Storage | undefined {
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}
