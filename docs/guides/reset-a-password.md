# Reset a password

NEXUS can't send email yet, so a forgotten password is reset on the server:

```sh
pnpm --filter @nexus/api reset-password owner@example.com
```

It prints a new random 20-character password, signs out every session of
that account, and writes a `password.reset_by_cli` audit entry. Sign in with
the printed password, then change it in Settings. An account that only used
Google gets a password sign-in as well.

The command uses `DATABASE_URL` from `.env.local` (or the environment), so it
resets the account in whichever database that points at. On Railway, run it
in the service's shell (`railway run pnpm --filter @nexus/api reset-password
<email>`). Signing in with Google keeps working meanwhile.
