import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoWithWordmark } from "@/components/layout/logo-mark";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-[4.5rem] items-center justify-between">
          <Link href="/" aria-label="ChainLink home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogoWithWordmark />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 sm:gap-2">
            <div className="mr-3 hidden items-center gap-6 lg:flex">
              <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How it works</Link>
              <Link href="/#for-everyone" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">For every role</Link>
              <Link href="/#security" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Security</Link>
              <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full pl-4 pr-3">
              <Link href="/signup">Get started <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white">
        <div className="container grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <LogoWithWordmark />
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              A shared source of truth for UK residential property chains, built
              for the professionals moving transactions forward.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:justify-end">
            <Link href="/#how-it-works" className="hover:text-foreground">Platform</Link>
            <Link href="/#for-everyone" className="hover:text-foreground">For every role</Link>
            <Link href="/#security" className="hover:text-foreground">Security</Link>
            <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
          <div className="border-t border-border pt-5 text-xs text-muted-foreground sm:col-span-2 sm:flex sm:justify-between">
            <span>&copy; {new Date().getFullYear()} ChainLink</span>
            <span className="mt-2 block sm:mt-0">Built for UK residential property transactions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
