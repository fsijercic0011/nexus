import type { Me } from "@nexus/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { stubFetch } from "@/test/fetch";
import { SettingsPage } from "./SettingsPage";

const auth = vi.hoisted(() => ({
  changePassword: vi.fn(),
  revokeSessions: vi.fn(),
  signOut: vi.fn(),
  twoFactor: {
    enable: vi.fn(),
    verifyTotp: vi.fn(),
    disable: vi.fn(),
  },
}));
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

const me = (overrides: Partial<Me> = {}): Me => ({
  user: {
    id: "u1",
    name: "Owner",
    email: "owner@example.com",
    twoFactorEnabled: false,
  },
  household: { id: "h1", name: "My household" },
  role: "admin",
  ...overrides,
});

function renderSettings(data: Me) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(ME_QUERY_KEY, data);
  const router = createMemoryRouter(
    [
      { path: "/settings", element: <SettingsPage /> },
      { path: "/sign-in", element: <p>sign-in page</p> },
    ],
    { initialEntries: ["/settings"] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, client };
}

const section = (name: string) => screen.getByRole("region", { name });

describe("SettingsPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the email read-only with the reason", () => {
    stubFetch({ "/api/health": { body: { status: "ok", database: "ok" } } });
    renderSettings(me());
    const profile = section("Profile");
    expect(within(profile).getByText("owner@example.com")).toBeInTheDocument();
    expect(
      within(profile).getByText(
        "Changing your email needs email delivery, which isn't set up yet.",
      ),
    ).toBeInTheDocument();
  });

  it("renames the household with an idempotency key", async () => {
    const fetchMock = stubFetch({
      "/api/health": { body: { status: "ok", database: "ok" } },
      "PATCH /api/household": { body: { name: "Home" } },
      "/api/me": { body: me({ household: { id: "h1", name: "Home" } }) },
    });
    renderSettings(me());
    const household = section("Household");
    const input = within(household).getByLabelText("Household name");
    await userEvent.clear(input);
    await userEvent.type(input, "Home");
    await userEvent.click(
      within(household).getByRole("button", { name: "Save" }),
    );

    const call = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(call?.[0]).toBe("/api/household");
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ name: "Home" });
    const headers = call?.[1]?.headers as Record<string, string>;
    expect(headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("shows the household read-only to a non-admin", () => {
    stubFetch({ "/api/health": { body: { status: "ok", database: "ok" } } });
    renderSettings(me({ role: "member" }));
    const household = section("Household");
    expect(within(household).getByLabelText("Household name")).toBeDisabled();
    expect(
      within(household).getByText("You can view this section but not edit it."),
    ).toBeInTheDocument();
  });

  it("turns on two-factor: password, QR and secret, code, then backup codes once", async () => {
    stubFetch({ "/api/health": { body: { status: "ok", database: "ok" } } });
    auth.twoFactor.enable.mockResolvedValue({
      data: {
        totpURI:
          "otpauth://totp/NEXUS:owner%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=NEXUS",
        backupCodes: ["aaaa-1111", "bbbb-2222"],
      },
      error: null,
    });
    auth.twoFactor.verifyTotp.mockResolvedValue({ data: {}, error: null });
    renderSettings(me());
    const twoFactor = section("Two-factor authentication");
    await userEvent.click(
      within(twoFactor).getByRole("button", { name: "Turn on" }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText("Current password"),
      "secret pw",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Continue" }),
    );
    expect(auth.twoFactor.enable).toHaveBeenCalledWith({
      password: "secret pw",
    });

    expect(
      await screen.findByRole("img", { name: /QR code/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("6-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("aaaa-1111")).toBeInTheDocument();
    expect(screen.getByText("bbbb-2222")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "I've saved these" }),
    );
    expect(screen.queryByText("aaaa-1111")).toBeNull();
  });

  it("signs out everywhere after confirming, then goes to sign-in", async () => {
    stubFetch({ "/api/health": { body: { status: "ok", database: "ok" } } });
    auth.revokeSessions.mockResolvedValue({ data: {}, error: null });
    const { router } = renderSettings(me());
    await userEvent.click(
      within(section("Sessions")).getByRole("button", {
        name: "Sign out everywhere",
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Sign out everywhere" }),
    );
    expect(auth.revokeSessions).toHaveBeenCalled();
    expect(await screen.findByText("sign-in page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sign-in");
    expect(router.state.location.search).toBe("");
  });
});
