import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getJson } from "@/lib/api";
import { stubFetch } from "@/test/fetch";
import { RequireSession } from "./RequireSession";

const me = {
  user: {
    id: "u1",
    name: "Owner",
    email: "owner@example.com",
    twoFactorEnabled: false,
  },
  household: { id: "h1", name: "My household" },
  role: "admin",
};

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/sign-in", element: <p>sign-in page</p> },
      {
        element: <RequireSession />,
        children: [
          { path: "/", element: <p>home page</p> },
          {
            path: "/settings",
            element: (
              <button
                type="button"
                onClick={() =>
                  void getJson("/api/other", z.unknown()).catch(() => {})
                }
              >
                load
              </button>
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("RequireSession", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends a signed-out visitor to sign-in, keeping where they were going", async () => {
    stubFetch({ "/api/me": { status: 401, body: {} } });
    const router = renderAt("/settings");
    expect(await screen.findByText("sign-in page")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?next=%2Fsettings");
  });

  it("shows the page once the session is confirmed", async () => {
    stubFetch({ "/api/me": { body: me } });
    renderAt("/");
    expect(await screen.findByText("home page")).toBeInTheDocument();
  });

  it("goes to sign-in when a later request finds the session ended", async () => {
    let signedIn = true;
    stubFetch({
      "/api/me": () => (signedIn ? { body: me } : { status: 401, body: {} }),
      "/api/other": { status: 401, body: {} },
    });
    renderAt("/settings");
    const button = await screen.findByRole("button", { name: "load" });
    signedIn = false;
    await userEvent.click(button);
    expect(await screen.findByText("sign-in page")).toBeInTheDocument();
  });
});
