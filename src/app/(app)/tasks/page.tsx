import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Tasks assigned to you across every chain."
      />
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Task creation and assignment will be built alongside chain
            milestones in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
