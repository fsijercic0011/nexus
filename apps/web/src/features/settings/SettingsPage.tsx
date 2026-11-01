import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HealthStatus } from "@/features/health/HealthStatus";

export function SettingsPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="Settings" page="settings" />
      <Card pad="md" className="flex flex-col gap-3">
        <CardHeader title="About" />
        <HealthStatus />
      </Card>
    </div>
  );
}
