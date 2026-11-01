import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { SettingsSection } from "./SettingsSection";

export function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
    });
    setBusy(false);
    if (result.error) {
      setError(
        result.error.status === 400 || result.error.status === 401
          ? "Your current password isn't right."
          : "The password couldn't be changed. Try again.",
      );
      return;
    }
    setCurrent("");
    setNext("");
    toast.success("Password changed.");
  }

  return (
    <SettingsSection
      title="Password"
      description="For signing in with your email. Forgot it? It can be reset with a server command."
    >
      <Card pad="form">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormField>
            <Label htmlFor="password-current">Current password</Label>
            <Input
              id="password-current"
              type="password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
              required
            />
          </FormField>
          <FormField>
            <Label htmlFor="password-new">New password</Label>
            <Input
              id="password-new"
              type="password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>
          {error && (
            <p role="alert" className="text-sm text-destructive md:col-span-2">
              {error}
            </p>
          )}
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={busy || !current || next.length < 8}
            >
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </SettingsSection>
  );
}
