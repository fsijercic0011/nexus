import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { HealthStatus } from "@/features/health/HealthStatus";
import { useMe } from "@/hooks/useMe";
import { HouseholdSection } from "./HouseholdSection";
import { PasswordSection } from "./PasswordSection";
import { ProfileSection } from "./ProfileSection";
import { SessionsSection } from "./SessionsSection";
import { SettingsSection } from "./SettingsSection";
import { TwoFactorSection } from "./TwoFactorSection";

export function SettingsPage() {
  const { data: me } = useMe();
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader title="Settings" page="settings" />
      {me ? (
        <>
          <ProfileSection me={me} />
          <PasswordSection />
          <TwoFactorSection me={me} />
          <SessionsSection />
          <HouseholdSection me={me} />
        </>
      ) : (
        <LoadingState />
      )}
      <SettingsSection title="About">
        <Card pad="form">
          <HealthStatus />
        </Card>
      </SettingsSection>
    </div>
  );
}
