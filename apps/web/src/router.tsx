import { createBrowserRouter } from "react-router-dom";
import { RequireSession } from "@/features/auth/RequireSession";
import { SignInPage } from "@/features/auth/SignInPage";
import { HomePage } from "@/features/home/HomePage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/sign-in", element: <SignInPage /> },
  {
    // The app shell, for signed-in members only.
    element: <RequireSession />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
