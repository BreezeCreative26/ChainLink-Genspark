import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ChainsPage() {
  return (
    <div>
      <PageHeader
        title="Chains"
        description="Every chain you or your firm is connected to."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> New chain
          </Button>
        }
      />

      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">
            No chains yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Chain creation and the chain list will be built in the next
            implementation step, once the data model is in place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
