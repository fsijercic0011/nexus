import { apiErrorSchema } from "@nexus/shared";
import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
    /** The API's error code and readable message, when it sent one. */
    readonly code?: string,
    readonly serverMessage?: string,
  ) {
    super(serverMessage ?? `Request to ${path} failed with status ${status}`);
    this.name = "ApiError";
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Called whenever the API answers 401: the session has ended. */
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

async function failure(response: Response, path: string): Promise<ApiError> {
  if (response.status === 401) unauthorizedHandler?.();
  const body = apiErrorSchema.safeParse(
    await response.json().catch(() => undefined),
  );
  return body.success
    ? new ApiError(
        response.status,
        path,
        body.data.error.code,
        body.data.error.message,
      )
    : new ApiError(response.status, path);
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
    throw await failure(response, path);
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) {
    throw new ApiError(response.status, path);
  }
  return parsed.data;
}

/** Sends a JSON write and validates the response. Pass an idempotencyKey
 * (a fresh UUIDv7 per save attempt, reused on retry) for repeat-safe saves. */
export async function sendJson<T>(
  method: "PATCH" | "POST",
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: { idempotencyKey?: string } = {},
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(options.idempotencyKey
        ? { "idempotency-key": options.idempotencyKey }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await failure(response, path);
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw new ApiError(response.status, path);
  return parsed.data;
}

/** A readable message for an error thrown by an API call or a form save. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.serverMessage && error.status < 500) return error.serverMessage;
    if (error.status === 401) return "Your session has ended. Sign in again.";
    if (error.status === 403) return "You don't have permission to do that.";
    return "Something went wrong. Please try again later.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again later.";
}
