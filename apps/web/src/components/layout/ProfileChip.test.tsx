import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProfileChip } from "./ProfileChip";

describe("ProfileChip", () => {
  it("truncates a long name and keeps it in the title", () => {
    const name = "A".repeat(120);
    render(
      <MemoryRouter>
        <ProfileChip name={name} email="owner@example.com" />
      </MemoryRouter>,
    );
    const shown = screen.getByText(name);
    expect(shown).toHaveClass("truncate");
    expect(shown.closest("[title]")).toHaveAttribute(
      "title",
      `${name} · owner@example.com`,
    );
  });
});
