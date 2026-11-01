import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PAGE_INFO } from "@/lib/page-info";
import { PageHeader } from "./page-header";

describe("PageHeader ⓘ", () => {
  it("opens the page's explanation", async () => {
    render(<PageHeader title="Home" page="home" />);
    await userEvent.click(
      screen.getByRole("button", { name: "About this page" }),
    );
    expect(await screen.findByText(PAGE_INFO.home.title)).toBeInTheDocument();
    for (const point of PAGE_INFO.home.points) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
  });
});
