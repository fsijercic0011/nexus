import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthStatus } from "./HealthStatus";

function renderWithQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

function respondWith(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HealthStatus", () => {
  it("shows ok state", async () => {
    respondWith(200, { status: "ok", database: "ok" });
    renderWithQueryClient();
    expect(
      await screen.findByText("API: ok · Database: ok"),
    ).toBeInTheDocument();
  });

  it("shows degraded state", async () => {
    respondWith(503, { status: "degraded", database: "unavailable" });
    renderWithQueryClient();
    expect(
      await screen.findByText("API: ok · Database: unavailable"),
    ).toBeInTheDocument();
  });

  it("shows unreachable on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    renderWithQueryClient();
    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });
});
