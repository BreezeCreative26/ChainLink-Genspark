import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="A cross-chain view of tasks assigned to you."
      />
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tasks already exist per chain (see a chain&apos;s workspace),
            but this cross-chain view — everything assigned to you across
            every chain in one list — isn&apos;t built yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
