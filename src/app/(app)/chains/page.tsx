import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Link2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listPersonalChainCards } from "@/server/services/chains";
import { getWorkspaceContext } from "@/server/services/workspace";

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker / progression",
};

const ACCESS_MODE_LABELS: Record<string, string> = {
  proxy: "Managed in proxy mode",
  guest: "Shared chain access",
  connected: "Connected to firm",
};

export default async function ChainsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [chains, workspace] = await Promise.all([
    listPersonalChainCards(supabase),
    user ? getWorkspaceContext(supabase, user.id) : null,
  ]);
  const participantHome = workspace?.mode === "participant";

  // Buyers, sellers, and other pure participants have a single-chain
  // workspace rather than a portfolio dashboard. Take them straight to the
  // canonical workspace so the full transaction progression is the first
  // thing they see after login (docs/OPERATING_MODEL.md, "Guest User Logic").
  const onlyChain = chains.length === 1 ? chains[0] : null;
  if (participantHome && onlyChain) {
    redirect(`/chains/${onlyChain.id}`);
  }

  return (
    <div>
      {participantHome ? (
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#102f34] to-[#164a50] px-6 py-7 text-white sm:px-8 sm:py-9">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">{workspace.roleLabel} view</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Your transaction, without the chasing
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                Follow shared progress, respond to approved actions, exchange documents, and see who is moving each part of your chain forward.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <PageHeader
          title="My chains"
          description="Chains where you are personally a participant. Use Overview for your firm's wider portfolio."
          actions={<NewChainButton />}
        />
      )}

      {participantHome && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-xs text-muted-foreground shadow-sm">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Your access is participant-scoped and enforced by database policies.</span>
          <span>Buyers, sellers, and single-chain guests never pay.</span>
        </div>
      )}

      {chains.length === 0 ? (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><Link2 className="h-5 w-5" /></span>
            <div>
              <p className="font-semibold text-foreground">No chains yet</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Create a chain for a new transaction, or use the secure link in an invitation to join an existing one.
              </p>
            </div>
            <NewChainButton />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {chains.map((chain) => (
            <Link key={chain.id} href={`/chains/${chain.id}`} className="group">
              <Card className="h-full overflow-hidden border-0 shadow-sm ring-1 ring-border transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/25">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <Link2 className="h-[1.1rem] w-[1.1rem]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {chain.addressLine1 ?? "Chain workspace"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {chain.city ?? ROLE_LABELS[chain.myRole] ?? chain.myRole}
                        </p>
                      </div>
                    </div>
                    <Badge variant={chain.status === "active" ? "success" : chain.status === "stalled" ? "destructive" : "secondary"} className="shrink-0 rounded-full text-[10px]">
                      {chain.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Shared milestone progress</span>
                      <span className="font-semibold text-foreground">{chain.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${chain.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border bg-slate-50/70 px-5 py-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="font-mono font-semibold text-primary">{chain.chainRef}</span>
                      <span>{ROLE_LABELS[chain.myRole] ?? chain.myRole}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {ACCESS_MODE_LABELS[chain.myAccessMode]}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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

function NewChainButton() {
  return (
    <Button size="sm" asChild className="rounded-full px-4">
      <Link href="/chains/new"><Plus className="h-4 w-4" /> New chain</Link>
    </Button>
  );
}
