// The "About this page" explanations behind the ⓘ in every page header.
// Update a page's entry whenever its behaviour changes.

export type PageId = "home" | "settings";

export type PageInfo = { title: string; summary: string; points: string[] };

export const PAGE_INFO: Record<PageId, PageInfo> = {
  home: {
    title: "About Home",
    summary: "Your starting point in NEXUS.",
    points: [
      "Home is empty for now: inventory, kitchen and shopping lists are coming next.",
      "Once they exist, Home becomes an overview of what needs attention in your household.",
    ],
  },
  settings: {
    title: "About Settings",
    summary: "Your account, its security and your household.",
    points: [
      "Profile: change the name NEXUS shows. Your email is shown but can't be changed yet, because changing it needs email delivery.",
      "Password: change it here. If you forget it, it can be reset with a server command.",
      "Two-factor authentication: when on, signing in with your password also asks for a code from your authenticator app. Signing in with Google relies on your Google account's own two-factor setting.",
      "Sign out everywhere ends every session on every device, including this one.",
      "Household: rename it. Only an admin can.",
      "About shows whether the NEXUS server and its database are reachable.",
    ],
  },
};
