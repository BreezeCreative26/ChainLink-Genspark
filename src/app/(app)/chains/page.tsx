import Link from "next/link";
import { Plus, Link2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listChainsForCurrentUser } from "@/server/services/chains";

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker",
};

const ACCESS_MODE_LABELS: Record<string, string> = {
  proxy: "Proxy",
  guest: "Guest",
  connected: "Connected",
};

export default async function ChainsPage() {
  const supabase = createClient();
  const chains = await listChainsForCurrentUser(supabase);

  return (
    <div>
      <PageHeader
        title="Chains"
        description="Every chain you're connected to."
        actions={
          <Button size="sm" asChild>
            <Link href="/chains/new">
              <Plus className="h-4 w-4" /> New chain
            </Link>
          </Button>
        }
      />

      {chains.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">No chains yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start a chain to create your first shared workspace.
            </p>
            <Button size="sm" asChild className="mt-2">
              <Link href="/chains/new">
                <Plus className="h-4 w-4" /> New chain
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {chains.map((chain) => (
            <Link key={chain.id} href={`/chains/${chain.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                      <Link2 className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {chain.chainRef}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[chain.myRole] ?? chain.myRole}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {ACCESS_MODE_LABELS[chain.myAccessMode] ?? chain.myAccessMode}
                    </Badge>
                    <Badge variant={chain.status === "active" ? "success" : "secondary"}>
                      {chain.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
