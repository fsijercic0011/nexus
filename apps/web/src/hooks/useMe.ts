import { type Me, meSchema } from "@nexus/shared";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getJson } from "@/lib/api";

export const ME_QUERY_KEY = ["me"] as const;

/** The signed-in person, their household and role; null when signed out. */
export function useMe() {
  return useQuery<Me | null>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getJson("/api/me", meSchema);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: (count, error) =>
      !(error instanceof ApiError && error.status < 500) && count < 2,
  });
}
