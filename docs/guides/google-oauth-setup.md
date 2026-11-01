# Google OAuth setup

NEXUS offers "Continue with Google" only when `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are set; without them the button is hidden and
password sign-in still works. Google is free for this use.

## Create the client

1. Open the [Google Cloud console](https://console.cloud.google.com/) and
   create a project (for example "NEXUS").
2. **APIs & Services → OAuth consent screen**: choose **External**, fill in
   the app name and your email, add the scopes `openid`, `email` and
   `profile`, and leave the app in **Testing** with your own Google account
   as a test user. Nothing else needs publishing for personal use.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   type **Web application**.
4. **Authorised JavaScript origins**:
   - `http://localhost:5173` (local development)
   - `https://<your-railway-domain>` (production)
5. **Authorised redirect URIs**:
   - `http://localhost:5173/api/auth/callback/google`
   - `https://<your-railway-domain>/api/auth/callback/google`
6. Copy the client ID and secret.

## Configure NEXUS

- Local: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`.
- Railway: add both as service variables, and set `BETTER_AUTH_URL` to
  `https://<your-railway-domain>`.

Google can only sign in emails on `SIGNUP_ALLOWED_EMAILS` (or already
existing accounts). If your Google email matches your password account, the
two are linked and either method signs in to the same account.

Keep 2-step verification on for your Google account: NEXUS's own TOTP code is
asked only after a password sign-in (ADR 0013).
