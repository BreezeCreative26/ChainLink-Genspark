import Link from "next/link";
import { CheckCircle2, Link2, Lock, Users } from "lucide-react";

import { LogoWithWordmark } from "@/components/layout/logo-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#102f34] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="auth-grid absolute inset-0 opacity-30" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />
        <Link href="/" className="relative w-fit rounded-md bg-white px-3 py-2">
          <LogoWithWordmark />
        </Link>

        <div className="relative max-w-xl py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">
            The completion workspace
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
            Keep every link moving, without the status chase.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            One secure view of milestones, actions, documents and risk across the
            whole property chain.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              [Link2, "Whole-chain visibility"],
              [Users, "Free guest access"],
              [Lock, "Firm-only privacy"],
              [CheckCircle2, "Auditable progress"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof Link2;
              return (
                <div key={label as string} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium">
                  <ItemIcon className="h-4 w-4 text-teal-300" />
                  {label as string}
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          Purpose-built for UK agents, conveyancers, buyers and sellers.
        </p>
      </section>

      <section className="flex min-h-dvh flex-col bg-[#f7faf9] px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden"><LogoWithWordmark /></Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Secure role-based access · Shared progress · Private firm data
        </p>
      </section>
    </main>
  );
}
