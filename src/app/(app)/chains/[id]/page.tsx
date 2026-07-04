import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getChainDetail } from "@/server/services/chains";

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

const ACTION_LABELS: Record<string, string> = {
  "chain.created": "Chain created",
};

export default async function ChainDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  let detail;
  try {
    detail = await getChainDetail(supabase, params.id);
  } catch {
    notFound();
  }

  const { chain, activity } = detail;
  if (!chain) notFound();

  const property = chain.properties?.[0];
  const participants = chain.chain_participants ?? [];

  return (
    <div>
      <PageHeader
        title={property ? property.address_line1 : "Chain workspace"}
        description={
          property?.city ? `${property.city}${property.postcode ? `, ${property.postcode}` : ""}` : undefined
        }
        actions={
          <Badge variant="outline" className="font-mono text-xs">
            {chain.chain_ref}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                No activity yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("en-GB")}
                      </p>
                    </div>
                    {entry.source === "proxy" && (
                      <Badge variant="secondary" className="text-[10px]">
                        Entered by proxy
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                No participants yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {ROLE_LABELS[p.role] ?? p.role}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {ACCESS_MODE_LABELS[p.access_mode] ?? p.access_mode}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
