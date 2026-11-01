import { expect, test } from "@playwright/test";

test("shell shows Home and a healthy API in Settings", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  const nav = page.getByRole("navigation", {
    name: isMobile ? "Tabs" : "Main",
  });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("API: ok · Database: ok")).toBeVisible();
});
