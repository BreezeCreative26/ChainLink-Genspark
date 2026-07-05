import { notFound } from "next/navigation";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getChainDetail } from "@/server/services/chains";
import { getAllowedDocumentCategories } from "@/lib/document-access";
import { InvitationsPanel } from "@/app/(app)/chains/[id]/invitations-panel";
import { MilestonesPanel } from "@/app/(app)/chains/[id]/milestones-panel";
import { DocumentsPanel } from "@/app/(app)/chains/[id]/documents-panel";
import { CommentsPanel } from "@/app/(app)/chains/[id]/comments-panel";

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
  "invitation.sent": "Invitation sent",
  "invitation.accepted": "Invitation accepted",
  "invitation.linked": "Invitation accepted and linked to a firm",
  "invitation.declined": "Invitation declined",
  "milestone.confirmed": "Milestone confirmed",
  "document.uploaded": "Document uploaded",
  "document.viewed": "Document opened",
  "comment.added": "Comment added",
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

  const { chain, activity, invitations, milestones, documents, comments } = detail;
  if (!chain) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const property = chain.properties?.[0];
  const participants = chain.chain_participants ?? [];
  const myParticipant = participants.find((p) => p.profile_id === user?.id);
  const isGuest = myParticipant?.access_mode === "guest";
  const allowedCategories = getAllowedDocumentCategories(
    myParticipant?.access_mode ?? null,
    (myParticipant?.role as Parameters<typeof getAllowedDocumentCategories>[1]) ?? null
  );

  const commentRows = comments.map((c) => {
    const participant = Array.isArray(c.chain_participants)
      ? c.chain_participants[0]
      : c.chain_participants;
    const profile = participant
      ? Array.isArray(participant.profiles)
        ? participant.profiles[0]
        : participant.profiles
      : null;
    return {
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      authorName: profile?.full_name ?? profile?.email ?? "Someone",
    };
  });

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

      {isGuest && (
        <div className="mb-4 rounded-md border border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
          You have guest access to this one chain. You can see shared updates,
          confirm anything asked of you, comment, and upload documents you're
          asked for.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestonesPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                isGuest={isGuest}
                milestones={milestones}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                comments={commentRows}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentsPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                myAccessMode={myParticipant?.access_mode ?? null}
                myOrganisationId={myParticipant?.organisation_id ?? null}
                documents={documents}
                allowedCategories={allowedCategories}
              />
            </CardContent>
          </Card>

          {!isGuest && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Activity</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/chains/${chain.id}/audit`}>
                    <ScrollText className="h-4 w-4" /> Full audit log
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
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
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isGuest ? "Who's involved" : "Participants"}</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                  No participants yet.
                </div>
              ) : (
                <ul className="space-y-3">
                  {participants.map((p) => {
                    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            {profile?.full_name ?? profile?.email ?? ROLE_LABELS[p.role]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[p.role] ?? p.role}
                          </p>
                        </div>
                        {/* Access mode / firm affiliation is internal detail —
                            not shown to guests, per docs/OPERATING_MODEL.md
                            ("guests must not see business dashboards"). */}
                        {!isGuest && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {ACCESS_MODE_LABELS[p.access_mode] ?? p.access_mode}
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <InvitationsPanel
                  chainId={chain.id}
                  myParticipantId={myParticipant?.id ?? null}
                  invitations={invitations}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
