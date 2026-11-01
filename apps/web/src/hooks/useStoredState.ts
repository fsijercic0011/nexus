import { createContext, useCallback, useContext, useState } from "react";
import {
  browserStorage,
  readStored,
  type StorageArea,
  userStorageKey,
  type Validate,
  writeStored,
} from "@/lib/stored-state";

/** The signed-in user's id, set by the session guard; null when signed out. */
export const StorageUserContext = createContext<string | null>(null);

/** A value remembered per signed-in user under `name`. Without a user it is
 * kept in memory only. A change of user re-reads the new user's value. */
export function useStoredState<T>(
  name: string,
  fallback: T,
  validate: Validate<T>,
  area: StorageArea = "local",
): [T, (next: T | ((prev: T) => T)) => void] {
  const userId = useContext(StorageUserContext);
  const key = userId ? userStorageKey(userId, name) : null;
  const read = () =>
    key ? readStored(browserStorage(area), key, fallback, validate) : fallback;
  const [state, setState] = useState(() => ({ key, value: read() }));
  // Re-read during render when the key changes (sign-in, another user), so
  // nobody ever sees the previous person's value.
  let current = state;
  if (state.key !== key) {
    current = { key, value: read() };
    setState(current);
  }

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value =
          typeof next === "function"
            ? (next as (prev: T) => T)(prev.value)
            : next;
        if (prev.key) writeStored(browserStorage(area), prev.key, value);
        return { key: prev.key, value };
      });
    },
    [area],
  );

  return [current.value, set];
}
