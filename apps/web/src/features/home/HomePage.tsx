import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home" page="home" />
      <Card>
        <EmptyState
          title="Nothing here yet"
          description="Inventory is coming. Once it's here, Home shows what needs attention."
        />
      </Card>
    </div>
  );
}
