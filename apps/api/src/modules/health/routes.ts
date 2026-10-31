import type { HealthResponse } from "@nexus/shared";
import type { FastifyInstance } from "fastify";

const DATABASE_CHECK_TIMEOUT_MS = 2000;

async function databaseAnswers(
  checkDatabase: () => Promise<boolean>,
): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), DATABASE_CHECK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([checkDatabase().catch(() => false), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function healthRoutes(
  app: FastifyInstance,
  options: { checkDatabase: () => Promise<boolean> },
): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const healthy = await databaseAnswers(options.checkDatabase);
    const body: HealthResponse = healthy
      ? { status: "ok", database: "ok" }
      : { status: "degraded", database: "unavailable" };
    return reply.code(healthy ? 200 : 503).send(body);
  });
}
