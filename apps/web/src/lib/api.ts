import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`Request to ${path} failed with status ${status}`);
    this.name = "ApiError";
  }
}

/**
 * Fetches JSON and validates it. A 503 whose body matches the schema resolves,
 * so callers like the health check can show a degraded state.
 */
export async function getJson<T>(path: string, schema: ZodType<T>): Promise<T> {
  const response = await fetch(path, {
    headers: { accept: "application/json" },
  });
  if (!response.ok && response.status !== 503) {
    throw new ApiError(response.status, path);
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) {
    throw new ApiError(response.status, path);
  }
  return parsed.data;
}
