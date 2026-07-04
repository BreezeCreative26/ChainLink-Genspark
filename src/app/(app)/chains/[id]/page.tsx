import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChainDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <PageHeader
        title="Chain workspace"
        description="Milestones, tasks, documents, notes, and participants for this chain."
        actions={
          <Badge variant="outline" className="font-mono text-xs">
            {params.id}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Milestones &amp; activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Chain timeline will be built in Phase 1 once the data model
              exists.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Participant list &amp; invites coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
