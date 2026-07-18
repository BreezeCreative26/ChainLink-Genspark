import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LogoWithWordmark } from "@/components/layout/logo-mark";

const navLinks = [
  { href: "/#ways-to-use", label: "Ways to use ChainLink" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#security", label: "Security" },
  { href: "/#pricing", label: "Pricing" },
];

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
            <div className="mr-4 hidden items-center gap-6 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
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
