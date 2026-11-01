import { expect, type Page, test } from "@playwright/test";
import * as OTPAuth from "otpauth";

const PASSWORD = "e2e password 1234";

function nav(page: Page, isMobile: boolean) {
  return page.getByRole("navigation", { name: isMobile ? "Tabs" : "Main" });
}

test("an unlisted email can't create an account", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Stranger");
  await page.getByLabel("Email").fill("stranger@nexus.test");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create the account" }).click();
  await expect(page.getByText("This account can't be created.")).toBeVisible();
});

test("owner signs up, renames the household, turns on 2FA and signs in again", async ({
  page,
  isMobile,
}, testInfo) => {
  const email = `owner+${testInfo.project.name}@nexus.test`;

  // Create the account; NEXUS opens Home.
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Owner");
  await page.getByLabel("Email").fill(`  ${email} `);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create the account" }).click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(nav(page, isMobile)).toBeVisible();

  // The page's ⓘ explains it.
  await page.getByRole("button", { name: "About this page" }).click();
  await expect(page.getByText("About Home")).toBeVisible();
  await page.keyboard.press("Escape");

  // Rename the household; it survives a reload.
  await nav(page, isMobile).getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  const household = page.getByRole("region", { name: "Household" });
  await household.getByLabel("Household name").fill("Kuća 🏠");
  await household.getByRole("button", { name: "Save" }).click();
  await expect(household.getByText("All changes saved")).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Household" })
      .getByLabel("Household name"),
  ).toHaveValue("Kuća 🏠");

  // Turn on two-factor with a code computed from the shown key.
  await page
    .getByRole("region", { name: "Two-factor authentication" })
    .getByRole("button", { name: "Turn on" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Current password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Continue" }).click();
  const secret = (
    (await dialog.locator("p.font-mono").textContent()) ?? ""
  ).trim();
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
  await dialog.getByLabel("6-digit code").fill(totp.generate());
  await dialog.getByRole("button", { name: "Verify" }).click();
  await dialog.getByRole("button", { name: "I've saved these" }).click();
  await expect(
    page
      .getByRole("region", { name: "Two-factor authentication" })
      .getByText("On", { exact: true }),
  ).toBeVisible();

  // Sign out, then back in: password, then the code.
  await page
    .getByRole("region", { name: "Sessions" })
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("6-digit code").fill(totp.generate());
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
});
