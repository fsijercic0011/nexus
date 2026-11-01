import { expect, test } from "@playwright/test";

test("home page shows healthy API", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "NEXUS" })).toBeVisible();
  await expect(page.getByText("API: ok · Database: ok")).toBeVisible();
});
