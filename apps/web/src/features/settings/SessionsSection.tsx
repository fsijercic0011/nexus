import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { authClient } from "@/lib/auth-client";
import { SettingsSection } from "./SettingsSection";

export function SessionsSection() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function leave(everywhere: boolean) {
    setBusy(true);
    if (everywhere) await authClient.revokeSessions();
    else await authClient.signOut();
    setBusy(false);
    setConfirming(false);
    // Leave the app first, so the session guard doesn't redirect with a
    // "come back to Settings" link for a deliberate sign-out.
    navigate("/sign-in", { replace: true });
    client.removeQueries({ queryKey: ME_QUERY_KEY });
  }

  return (
    <SettingsSection title="Sessions">
      <Card pad="form" className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void leave(false)}
        >
          Sign out
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Sign out everywhere
        </Button>
      </Card>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Sign out everywhere?"
        description="Every device signed in to NEXUS, including this one, will need to sign in again."
        confirmLabel="Sign out everywhere"
        pending={busy}
        onConfirm={() => void leave(true)}
      />
    </SettingsSection>
  );
}
