import type { Me } from "@nexus/shared";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { authClient } from "@/lib/auth-client";
import { SettingsSection } from "./SettingsSection";

type Step =
  | { kind: "closed" }
  | { kind: "password"; turningOn: boolean }
  | { kind: "scan"; totpURI: string; backupCodes: string[] }
  | { kind: "codes"; backupCodes: string[] };

function secretOf(totpURI: string): string {
  return new URL(totpURI).searchParams.get("secret") ?? "";
}

export function TwoFactorSection({ me }: { me: Me }) {
  const client = useQueryClient();
  const [step, setStep] = useState<Step>({ kind: "closed" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = me.user.twoFactorEnabled;

  function close() {
    setStep({ kind: "closed" });
    setPassword("");
    setCode("");
    setError(null);
  }

  async function confirmPassword(event: FormEvent) {
    event.preventDefault();
    if (step.kind !== "password") return;
    setBusy(true);
    setError(null);
    if (step.turningOn) {
      const result = await authClient.twoFactor.enable({ password });
      setBusy(false);
      if (result.error || !result.data || !("totpURI" in result.data)) {
        setError("That password isn't right.");
        return;
      }
      setPassword("");
      setStep({
        kind: "scan",
        totpURI: result.data.totpURI,
        backupCodes: result.data.backupCodes,
      });
      return;
    }
    const result = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (result.error) {
      setError("That password isn't right.");
      return;
    }
    close();
    toast.success("Two-factor authentication is off.");
    await client.invalidateQueries({ queryKey: ME_QUERY_KEY });
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (step.kind !== "scan") return;
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({
      code: code.replace(/\s+/g, ""),
    });
    setBusy(false);
    if (result.error) {
      setError("That code didn't work. Try again.");
      return;
    }
    setCode("");
    setStep({ kind: "codes", backupCodes: step.backupCodes });
    await client.invalidateQueries({ queryKey: ME_QUERY_KEY });
  }

  return (
    <SettingsSection
      title="Two-factor authentication"
      description="When on, signing in with your password also asks for a code from an authenticator app. Google sign-in relies on your Google account's own 2-step verification."
    >
      <Card
        pad="form"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Badge variant={enabled ? "success" : "neutral"}>
          {enabled ? "On" : "Off"}
        </Badge>
        <Button
          type="button"
          variant={enabled ? "danger" : "default"}
          onClick={() => setStep({ kind: "password", turningOn: !enabled })}
        >
          {enabled ? "Turn off" : "Turn on"}
        </Button>
      </Card>

      <ResponsiveDialog
        open={step.kind !== "closed"}
        onOpenChange={(open) => {
          // The backup codes are shown once: closing needs the explicit button.
          if (!open && step.kind !== "codes") close();
        }}
        dismissible={step.kind !== "codes"}
        title={
          step.kind === "codes"
            ? "Save your backup codes"
            : step.kind === "password" && !step.turningOn
              ? "Turn off two-factor"
              : "Turn on two-factor"
        }
      >
        {step.kind === "password" && (
          <form className="flex flex-col gap-4" onSubmit={confirmPassword}>
            <FormField>
              <Label htmlFor="two-factor-password">Current password</Label>
              <Input
                id="two-factor-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
            </FormField>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !password}>
              Continue
            </Button>
          </form>
        )}

        {step.kind === "scan" && (
          <form className="flex flex-col gap-4" onSubmit={verify}>
            <p className="text-sm text-muted-foreground">
              Scan this with your authenticator app, or type the key below.
            </p>
            <div className="self-center rounded-lg bg-foreground p-3">
              <QRCodeSVG
                value={step.totpURI}
                size={176}
                role="img"
                aria-label="QR code for your authenticator app"
              />
            </div>
            <p className="text-center font-mono text-sm break-all">
              {secretOf(step.totpURI)}
            </p>
            <FormField>
              <Label htmlFor="two-factor-setup-code">6-digit code</Label>
              <Input
                id="two-factor-setup-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </FormField>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !code.trim()}>
              Verify
            </Button>
          </form>
        )}

        {step.kind === "codes" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Each code signs you in once if you lose your phone. They won't be
              shown again.
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {step.backupCodes.map((backupCode) => (
                <li key={backupCode} className="rounded-md bg-muted px-2 py-1">
                  {backupCode}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              onClick={() => {
                close();
                toast.success("Two-factor authentication is on.");
              }}
            >
              I've saved these
            </Button>
          </div>
        )}
      </ResponsiveDialog>
    </SettingsSection>
  );
}
