# UI flows

## Signing in

1. Any app URL without a session → `/sign-in?next=<that path>`.
2. **I have an account**: email + password → if two-factor is on, the
   two-factor check (code or backup code) → the `next` page (or Home).
   **Continue with Google** (when configured) → Google → the `next` page.
3. **Create account** (allowlisted emails only): name, email, password →
   Home. The household is created on the first signed-in request.
4. Inside the app, any API answer of 401 (session ended elsewhere or
   expired) → `/sign-in?next=<current path>`.
5. **Sign out** / **Sign out everywhere** in Settings → `/sign-in` (no
   `next`).

## Shell

Desktop: sidebar (Home, Settings, the profile chip → Settings). Phone:
bottom tab bar (Home, Settings). Every page opens with its title and ⓘ. See
[app shell](../features/shell/app-shell.md).
