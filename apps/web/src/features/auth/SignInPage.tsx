import { authProvidersSchema } from "@nexus/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { getJson } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { TwoFactorStep } from "./TwoFactorStep";

type Mode = "sign-in" | "create";

/** Only paths inside the app; anything else falls back to Home. */
function safeNext(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** The message for a Google sign-in that came back with ?error=<code>. */
function googleFailureMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "account_not_linked") {
    return "This email already has a password account. Sign in with your password.";
  }
  return "Google sign-in didn't work. Only allowed emails can create an account.";
}

function failureMessage(
  mode: Mode,
  error: { status?: number; message?: string },
): string {
  if (error.status === 429) {
    return "Too many attempts. Wait a few seconds and try again.";
  }
  if (mode === "create") {
    if (error.status === 403) return "This account can't be created.";
    return error.message ?? "The account couldn't be created.";
  }
  if (error.status === 401) return "That email and password don't match.";
  return error.message ?? "Signing in didn't work. Try again.";
}

export function SignInPage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(() =>
    googleFailureMessage(params.get("error")),
  );
  const [twoFactor, setTwoFactor] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const providers = useQuery({
    queryKey: ["auth-providers"],
    queryFn: () => getJson("/api/auth-providers", authProvidersSchema),
  });
  const next = safeNext(params.get("next"));

  function finish() {
    // Drop any cached "signed out" answer so the session guard waits for a
    // fresh one instead of bouncing straight back here.
    client.removeQueries({ queryKey: ME_QUERY_KEY });
    navigate(next, { replace: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const credentials = { email: email.trim(), password };
    const result =
      mode === "create"
        ? await authClient.signUp.email({ ...credentials, name: name.trim() })
        : await authClient.signIn.email(credentials);
    setBusy(false);
    if (result.error) {
      setError(failureMessage(mode, result.error));
      return;
    }
    if (
      result.data &&
      "twoFactorRedirect" in result.data &&
      result.data.twoFactorRedirect
    ) {
      setTwoFactor(true);
      return;
    }
    finish();
  }

  async function google() {
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: "/sign-in",
    });
    if (result?.error) setError("Google sign-in didn't start. Try again.");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card pad="md" className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold tracking-[0.16em]">NEXUS</p>
          <h1 className="text-2xl font-semibold">
            {twoFactor
              ? "Two-factor check"
              : mode === "create"
                ? "Create your account"
                : "Sign in"}
          </h1>
        </div>

        {twoFactor ? (
          <TwoFactorStep onVerified={finish} />
        ) : (
          <>
            <Segmented
              aria-label="Sign in or create an account"
              options={[
                { id: "sign-in", label: "I have an account" },
                { id: "create", label: "Create account" },
              ]}
              value={mode}
              onChange={(value) => {
                setMode(value);
                setError(null);
              }}
            />
            <form className="flex flex-col gap-4" onSubmit={submit}>
              {mode === "create" && (
                <FormField>
                  <Label htmlFor="sign-in-name">Name</Label>
                  <Input
                    id="sign-in-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </FormField>
              )}
              <FormField>
                <Label htmlFor="sign-in-email">Email</Label>
                <Input
                  id="sign-in-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </FormField>
              <FormField>
                <Label htmlFor="sign-in-password">Password</Label>
                <Input
                  id="sign-in-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    mode === "create" ? "new-password" : "current-password"
                  }
                  minLength={mode === "create" ? 8 : undefined}
                  required
                />
              </FormField>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={busy}>
                {mode === "create" ? "Create the account" : "Sign in"}
              </Button>
            </form>
            {providers.data?.google && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void google()}
              >
                Continue with Google
              </Button>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
