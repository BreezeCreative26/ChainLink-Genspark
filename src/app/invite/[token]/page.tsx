import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoWithWordmark } from "@/components/layout/logo-mark";
import { createClient } from "@/lib/supabase/server";
import {
  checkInvitationForCurrentUser,
  getInvitationForDisplayAndMarkViewed,
} from "@/server/services/invitations";
import { InviteResponseForm } from "@/app/invite/[token]/invite-response-form";

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker",
};

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const display = await getInvitationForDisplayAndMarkViewed(params.token);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-8">
        <LogoWithWordmark />
      </Link>

      <div className="w-full max-w-md">
        {!display ? (
          <Card>
            <CardHeader>
              <CardTitle>Invitation not found</CardTitle>
              <CardDescription>
                This invitation link is invalid, has expired, or has already
                been used.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !["invited", "viewed"].includes(display.status) ? (
          <Card>
            <CardHeader>
              <CardTitle>This invitation has already been resolved</CardTitle>
              <CardDescription>
                No further action is needed here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <InvitationContent token={params.token} display={display} />
        )}
      </div>
    </div>
  );
}

async function InvitationContent({
  token,
  display,
}: {
  token: string;
  display: NonNullable<Awaited<ReturnType<typeof getInvitationForDisplayAndMarkViewed>>>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card>
      <CardHeader>
        <Badge variant="outline" className="mb-2 w-fit font-mono text-xs">
          {display.chainRef}
        </Badge>
        <CardTitle>You&apos;ve been invited to a property chain</CardTitle>
        <CardDescription>
          {display.inviterName ? `${display.inviterName} invited you` : "You were invited"}{" "}
          to join as <strong>{ROLE_LABELS[display.role] ?? display.role}</strong>
          {display.propertyAddress ? ` on ${display.propertyAddress}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Log in or create a free account to respond. You&apos;ll only get
              access to this one chain — no business account required.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/login?redirect=/invite/${token}`}>Log in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/signup?redirect=/invite/${token}`}>Sign up</Link>
              </Button>
            </div>
          </div>
        ) : (
          <InvitationResponseGate token={token} />
        )}
      </CardContent>
    </Card>
  );
}

async function InvitationResponseGate({ token }: { token: string }) {
  const supabase = createClient();
  const check = await checkInvitationForCurrentUser(supabase, token);

  if (check.outcome === "email_mismatch") {
    return (
      <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-sm text-foreground">
          This invitation was sent to <strong>{check.invitedEmail}</strong>,
          but you&apos;re signed in with a different email address.
        </p>
        <p className="text-xs text-muted-foreground">
          For security, only the exact invited email address can respond to
          this invitation. Log out and sign in as {check.invitedEmail}, or ask
          whoever invited you to resend it to the correct address.
        </p>
      </div>
    );
  }

  if (check.outcome === "not_found") {
    return (
      <p className="text-sm text-muted-foreground">
        This invitation is no longer available.
      </p>
    );
  }

  return <InviteResponseForm token={token} accountMatch={check.accountMatch} />;
}
