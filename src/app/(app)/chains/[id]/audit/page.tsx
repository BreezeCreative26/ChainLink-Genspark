import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getChainHeader } from "@/server/services/chains";
import { getAuditLog } from "@/server/services/audit";

const ACTION_LABELS: Record<string, string> = {
  "chain.created": "Chain created",
  "invitation.sent": "Invitation sent",
  "invitation.accepted": "Invitation accepted",
  "invitation.linked": "Invitation accepted and linked to a firm",
  "invitation.declined": "Invitation declined",
  "milestone.confirmed": "Milestone confirmed",
  "document.uploaded": "Document uploaded",
  "document.viewed": "Document opened",
  "comment.added": "Comment added",
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  proxy: "Proxy",
  system: "System",
};

export default async function ChainAuditLogPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const chain = await getChainHeader(supabase, params.id);
  if (!chain) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const participants = chain.chain_participants ?? [];
  const myParticipant = participants.find((p) => p.profile_id === user?.id);
  const isGuest = myParticipant?.access_mode === "guest";

  // The full audit log (proxy attribution, firm-internal entries) is
  // professional-facing — the casual "Activity" card on the main chain
  // page is what guests see instead. See docs/DECISIONS.md
  // ("Document handling") for the reasoning.
  if (isGuest) {
    redirect(`/chains/${params.id}`);
  }

  const entries = await getAuditLog(supabase, params.id);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description={`Full activity history for ${chain.chain_ref}.`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/chains/${params.id}`}>
              <ArrowLeft className="h-4 w-4" /> Back to chain
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">By</th>
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 pr-4 font-medium">Visibility</th>
                    <th className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 text-foreground">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {entry.actorName ?? "System"}
                        {entry.onBehalfOfName && (
                          <span className="text-xs"> (on behalf of {entry.onBehalfOfName})</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-[10px]">
                          {SOURCE_LABELS[entry.source] ?? entry.source}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant={entry.visibility === "internal" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {entry.visibility}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
