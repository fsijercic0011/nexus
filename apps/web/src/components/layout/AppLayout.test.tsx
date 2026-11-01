import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { setPhoneViewport } from "@/test/viewport";
import { AppLayout } from "./AppLayout";

function renderShell() {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <p>home page</p> },
          { path: "/settings", element: <p>settings page</p> },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("AppLayout", () => {
  it("shows the sidebar with Home and Settings on desktop", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Settings" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Tabs" })).toBeNull();
    expect(screen.queryByRole("button", { name: /scan/i })).toBeNull();
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("shows the bottom bar instead of the sidebar on phones", () => {
    setPhoneViewport(true);
    renderShell();
    const bar = screen.getByRole("navigation", { name: "Tabs" });
    expect(within(bar).getByRole("link", { name: "Home" })).toBeVisible();
    expect(within(bar).getByRole("link", { name: "Settings" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    expect(screen.queryByRole("button", { name: /scan/i })).toBeNull();
  });
});
