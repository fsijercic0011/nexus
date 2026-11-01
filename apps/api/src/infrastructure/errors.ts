import type { ApiErrorBody } from "@nexus/shared";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

/** An error with an HTTP status and a stable code for the client. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorBody(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

function isCodedError(
  error: unknown,
): error is Error & { statusCode: number; code: string } {
  return (
    error instanceof Error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number" &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/** Shapes every error under this scope as { error: { code, message } }. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "The request is invalid.";
      return reply.status(400).send(errorBody("validation_failed", message));
    }
    if (isCodedError(error) && error.statusCode < 500) {
      const code = error.code.startsWith("FST_") ? "bad_request" : error.code;
      return reply
        .status(error.statusCode)
        .send(errorBody(code, error.message));
    }
    request.log.error(error);
    return reply
      .status(500)
      .send(
        errorBody("internal", "Something went wrong. Please try again later."),
      );
  });
}
