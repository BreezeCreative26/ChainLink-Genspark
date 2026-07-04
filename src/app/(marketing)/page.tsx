import Link from "next/link";
import { ArrowRight, Users, UserPlus, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketingHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container flex flex-col items-start gap-6 py-24">
          <Badge variant="accent" className="font-mono text-[11px] tracking-wide">
            CHAIN-XXXXXX &middot; live example
          </Badge>
          <h1 className="max-w-2xl font-display text-5xl font-medium leading-[1.1] tracking-tight text-foreground">
            One chain. One shared truth. No chasing.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            ChainLink gives agents, conveyancers, buyers and sellers a single
            shared workspace for every property chain — so no one has to phone
            around to find out what&apos;s actually happening.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Start a chain <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#platform">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Three modes */}
      <section id="platform" className="container py-24">
        <div className="mb-12 max-w-xl">
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
            Works whether you&apos;re the only one using it, or your whole chain is.
          </h2>
          <p className="mt-3 text-muted-foreground">
            ChainLink never depends on universal adoption. Every party gets a
            way in that matches what they actually need.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Users className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold text-foreground">Proxy mode</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One agent tracks the whole chain on everyone&apos;s behalf.
                No one else needs an account for you to get value on day one.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <UserPlus className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold text-foreground">
                Guest collaboration
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite a buyer, seller, or the other side&apos;s conveyancer
                into one chain — free, with no account required.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Building2 className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold text-foreground">
                Connected professional
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Firms with a ChainLink business account see every chain their
                team is in, with workload and risk in one dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t border-border bg-secondary/40">
        <div className="container flex flex-col items-start gap-4 py-20">
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
            Free for the people in the chain. Paid for the firms running it.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Buyers and sellers never pay. Estate agencies and conveyancing
            firms pay for the multi-chain dashboard that keeps their whole
            caseload visible.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
