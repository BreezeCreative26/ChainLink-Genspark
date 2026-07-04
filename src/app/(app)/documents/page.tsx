import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="Documents shared across your chains."
      />
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">
            No documents yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Document storage and access control will use Supabase Storage,
            built in Phase 3 per docs/ROADMAP.md.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
