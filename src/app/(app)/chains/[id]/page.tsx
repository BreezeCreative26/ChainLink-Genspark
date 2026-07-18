import { notFound } from "next/navigation";
import Link from "next/link";
import { Eye, ScrollText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getChainDetail } from "@/server/services/chains";
import { getWorkspaceContext } from "@/server/services/workspace";
import { listInternalNotes } from "@/server/services/notes";
import { getAllowedDocumentCategories } from "@/lib/document-access";
import { InvitationsPanel } from "@/app/(app)/chains/[id]/invitations-panel";
import { MilestonesPanel } from "@/app/(app)/chains/[id]/milestones-panel";
import { DocumentsPanel } from "@/app/(app)/chains/[id]/documents-panel";
import { CommentsPanel } from "@/app/(app)/chains/[id]/comments-panel";
import { TasksPanel } from "@/app/(app)/chains/[id]/tasks-panel";
import { InternalNotesPanel } from "@/app/(app)/chains/[id]/internal-notes-panel";
import { TopologyPanel } from "@/app/(app)/chains/[id]/topology-panel";
import { AddProxyParticipantForm } from "@/app/(app)/chains/[id]/add-proxy-participant-form";

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
  "milestone.created": "Milestone added",
  "milestone.status_changed": "Milestone updated",
  "document.uploaded": "Document uploaded",
  "document.viewed": "Document opened",
  "comment.added": "Comment added",
  "note.added": "Internal note added",
  "task.created": "Task added",
  "task.status_changed": "Task updated",
  "participant.added_proxy": "Proxy participant added",
  "chain_node.added": "Linked transaction added",
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

  const { chain, activity, invitations, milestones, documents, comments, tasks, chainNodes } = detail;
  if (!chain) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workspace = await getWorkspaceContext(supabase, user.id);
  const property = chain.properties?.[0];
  const participants = chain.chain_participants ?? [];
  const myParticipant = participants.find((p) => p.profile_id === user.id);
  const isGuest = myParticipant?.access_mode === "guest";
  const isReadOnlyObserver = !myParticipant && workspace.mode === "firm";
  const canManageChain = Boolean(myParticipant && !isGuest);
  const myOrganisationId =
    myParticipant?.organisation_id ?? workspace.organisationId;
  const allowedCategories = getAllowedDocumentCategories(
    myParticipant?.access_mode ?? null,
    (myParticipant?.role as Parameters<typeof getAllowedDocumentCategories>[1]) ?? null
  );

  const internalNotes = myOrganisationId
    ? await listInternalNotes(supabase, chain.id, myOrganisationId)
    : [];

  function resolveAuthorName(row: {
    chain_participants: unknown;
  }): string {
    const participant = Array.isArray(row.chain_participants)
      ? row.chain_participants[0]
      : row.chain_participants;
    const p = participant as { profiles?: unknown } | null;
    const profile = p?.profiles
      ? Array.isArray(p.profiles)
        ? (p.profiles as { full_name: string | null; email: string }[])[0]
        : (p.profiles as { full_name: string | null; email: string })
      : null;
    return profile?.full_name ?? profile?.email ?? "Someone";
  }

  const commentRows = comments.map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    authorName: resolveAuthorName(c),
  }));

  const internalNoteRows = internalNotes.map((n) => ({
    id: n.id,
    body: n.body,
    created_at: n.created_at,
    authorName: resolveAuthorName(n),
  }));

  const nodeRows = chainNodes.map((n) => {
    const prop = Array.isArray(n.properties) ? n.properties[0] : n.properties;
    return {
      id: n.id,
      sequenceIndex: n.sequence_index,
      dependsOnNodeId: n.depends_on_node_id,
      status: n.status,
      sellerParticipantId: n.seller_participant_id,
      buyerParticipantId: n.buyer_participant_id,
      address: [prop?.address_line1, prop?.city].filter(Boolean).join(", ") || "Untitled property",
      postcode: prop?.postcode ?? null,
    };
  });

  const participantRows = participants
    .filter((participant) => participant.status === "active")
    .map((participant) => {
      const profile = Array.isArray(participant.profiles)
        ? participant.profiles[0]
        : participant.profiles;

      return {
        id: participant.id,
        profileId: participant.profile_id,
        name: profile?.full_name ?? profile?.email ?? ROLE_LABELS[participant.role] ?? "Chain member",
        role: participant.role,
        accessMode: participant.access_mode,
        isCurrentUser: participant.profile_id === user.id,
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
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          You have guest access to this one chain. You can see shared updates,
          confirm anything asked of you, comment, and upload documents you&apos;re
          asked for.
        </div>
      )}

      {isReadOnlyObserver && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Eye className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Firm oversight — read only</p>
            <p className="mt-0.5 text-amber-800">
              This chain is connected to {workspace.organisationName ?? "your firm"}
              through a colleague. You can review shared progress and your firm&apos;s
              internal information, but only a direct chain participant can make changes.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestonesPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                myOrganisationId={myOrganisationId}
                isGuest={isGuest}
                readOnly={isReadOnlyObserver}
                milestones={milestones}
              />
            </CardContent>
          </Card>

          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle>Chain overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  See who is connected and how each property transaction depends on the next.
                </p>
              </CardHeader>
              <CardContent>
                <TopologyPanel
                  chainId={chain.id}
                  myParticipantId={myParticipant?.id ?? null}
                  readOnly={isReadOnlyObserver}
                  nodes={nodeRows}
                  participants={participantRows}
                />
              </CardContent>
            </Card>
          )}

          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <TasksPanel
                  chainId={chain.id}
                  myParticipantId={myParticipant?.id ?? null}
                  myOrganisationId={myOrganisationId}
                  readOnly={isReadOnlyObserver}
                  tasks={tasks}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                readOnly={isReadOnlyObserver}
                comments={commentRows}
              />
            </CardContent>
          </Card>

          {!isGuest && myOrganisationId && (
            <Card>
              <CardHeader>
                <CardTitle>Internal notes</CardTitle>
              </CardHeader>
              <CardContent>
                <InternalNotesPanel
                  chainId={chain.id}
                  organisationId={myOrganisationId}
                  myParticipantId={myParticipant?.id ?? null}
                  readOnly={isReadOnlyObserver}
                  notes={internalNoteRows}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentsPanel
                chainId={chain.id}
                myParticipantId={myParticipant?.id ?? null}
                myAccessMode={myParticipant?.access_mode ?? null}
                myOrganisationId={myOrganisationId}
                readOnly={isReadOnlyObserver}
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
            <CardContent className="space-y-3">
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

              {canManageChain && myParticipant && (
                <AddProxyParticipantForm
                  chainId={chain.id}
                  managerParticipantId={myParticipant.id}
                />
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
                  readOnly={isReadOnlyObserver}
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
