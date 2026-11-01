import { vi } from "vitest";

type Route = { status?: number; body?: unknown };

/** Stubs global fetch with fixed JSON responses per "METHOD path" (or path
 * for GET); unknown paths answer 404. Returns the mock to inspect calls. */
export function stubFetch(routes: Record<string, Route | (() => Route)>) {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const method = (init?.method ?? "GET").toUpperCase();
    const entry = routes[`${method} ${url.pathname}`] ?? routes[url.pathname];
    const route = typeof entry === "function" ? entry() : entry;
    if (!route) return new Response("{}", { status: 404 });
    return new Response(JSON.stringify(route.body ?? {}), {
      status: route.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}
