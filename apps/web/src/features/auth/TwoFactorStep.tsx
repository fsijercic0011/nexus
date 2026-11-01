import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

/** The second sign-in step for a password sign-in with two-factor on: a code
 * from the authenticator app, or a one-time backup code. */
export function TwoFactorStep({ onVerified }: { onVerified: () => void }) {
  const [backup, setBackup] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const trimmed = code.replace(/\s+/g, "");
    const result = backup
      ? await authClient.twoFactor.verifyBackupCode({ code: trimmed })
      : await authClient.twoFactor.verifyTotp({ code: trimmed });
    setBusy(false);
    if (result.error) {
      setError(
        backup
          ? "That backup code didn't work. Each code works only once."
          : "That code didn't work. Try again.",
      );
      return;
    }
    onVerified();
  }

  const fieldLabel = backup ? "Backup code" : "6-digit code";
  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <p className="text-sm text-muted-foreground">
        {backup
          ? "Enter one of the backup codes you saved when you turned on two-factor."
          : "Enter the code from your authenticator app."}
      </p>
      <FormField>
        <Label htmlFor="two-factor-code">{fieldLabel}</Label>
        <Input
          id="two-factor-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="one-time-code"
          inputMode={backup ? "text" : "numeric"}
          autoFocus
          required
        />
      </FormField>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || code.trim() === ""}>
        Verify
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={() => {
          setBackup((value) => !value);
          setCode("");
          setError(null);
        }}
      >
        {backup ? "Use the authenticator app" : "Use a backup code"}
      </Button>
    </form>
  );
}
