import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { stubFetch } from "@/test/fetch";
import { RequireSession } from "./RequireSession";
import { SignInPage } from "./SignInPage";

const auth = vi.hoisted(() => ({
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  twoFactor: { verifyTotp: vi.fn(), verifyBackupCode: vi.fn() },
}));
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

function renderPage(initialEntry = "/sign-in") {
  const router = createMemoryRouter(
    [
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/", element: <p>home page</p> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("SignInPage", () => {
  beforeEach(() => {
    stubFetch({ "/api/auth-providers": { body: { google: false } } });
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows email, password and a create-account switch, without Google when it's off", async () => {
    renderPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
    await screen.findByRole("button", { name: "Sign in" });
    expect(screen.queryByRole("button", { name: /Google/ })).toBeNull();
  });

  it("explains a Google sign-in that ended in an error", async () => {
    renderPage("/sign-in?error=account_not_linked");
    expect(
      await screen.findByText(
        "This email already has a password account. Sign in with your password.",
      ),
    ).toBeInTheDocument();
  });

  it("explains any other Google failure, including an email that isn't allowed", async () => {
    renderPage("/sign-in?error=unable_to_create_user");
    expect(
      await screen.findByText(
        "Google sign-in didn't work. Only allowed emails can create an account.",
      ),
    ).toBeInTheDocument();
  });

  it("offers Google when it's configured", async () => {
    stubFetch({ "/api/auth-providers": { body: { google: true } } });
    renderPage();
    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
  });

  it("trims the email and goes home after signing in", async () => {
    auth.signIn.email.mockResolvedValue({ data: { user: {} }, error: null });
    const router = renderPage();
    await userEvent.type(
      screen.getByLabelText("Email"),
      "  owner@example.com ",
    );
    await userEvent.type(screen.getByLabelText("Password"), "a password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.signIn.email).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "a password",
    });
    expect(await screen.findByText("home page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("explains a refused sign-up", async () => {
    auth.signUp.email.mockResolvedValue({
      data: null,
      error: { status: 403, message: "This account can't be created." },
    });
    renderPage();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await userEvent.type(screen.getByLabelText("Name"), "Stranger");
    await userEvent.type(screen.getByLabelText("Email"), "x@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "a long password");
    await userEvent.click(
      screen.getByRole("button", { name: "Create the account" }),
    );
    expect(
      await screen.findByText("This account can't be created."),
    ).toBeInTheDocument();
  });

  it("asks for the two-factor code and reports a wrong one", async () => {
    auth.signIn.email.mockResolvedValue({
      data: { twoFactorRedirect: true },
      error: null,
    });
    auth.twoFactor.verifyTotp.mockResolvedValue({
      data: null,
      error: { status: 401, message: "Invalid code" },
    });
    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "owner@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "a password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const code = await screen.findByLabelText("6-digit code");
    expect(
      screen.getByRole("button", { name: "Use a backup code" }),
    ).toBeInTheDocument();
    await userEvent.type(code, "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(
      await screen.findByText("That code didn't work. Try again."),
    ).toBeInTheDocument();
  });

  it("lands in the app even when an earlier visit cached 'signed out'", async () => {
    stubFetch({
      "/api/auth-providers": { body: { google: false } },
      "/api/me": {
        body: {
          user: {
            id: "u1",
            name: "Owner",
            email: "owner@example.com",
            twoFactorEnabled: false,
          },
          household: { id: "h1", name: "My household" },
          role: "admin",
        },
      },
    });
    auth.signIn.email.mockResolvedValue({ data: { user: {} }, error: null });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(ME_QUERY_KEY, null);
    const router = createMemoryRouter(
      [
        { path: "/sign-in", element: <SignInPage /> },
        {
          element: <RequireSession />,
          children: [{ path: "/", element: <p>home page</p> }],
        },
      ],
      { initialEntries: ["/sign-in"] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "owner@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "a password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("home page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});
