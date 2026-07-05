import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="A cross-chain view of documents you have access to."
      />
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Document upload, categories, and secure storage already work
            per chain (see a chain&apos;s workspace) — this cross-chain
            view, listing every document across all your chains in one
            place, isn&apos;t built yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
