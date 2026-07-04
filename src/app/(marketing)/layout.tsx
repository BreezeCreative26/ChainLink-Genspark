import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoWithWordmark } from "@/components/layout/logo-mark";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <LogoWithWordmark />
          <nav className="flex items-center gap-6">
            <Link
              href="#platform"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
            >
              Platform
            </Link>
            <Link
              href="#pricing"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
            >
              Pricing
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="container flex h-16 items-center justify-between text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} ChainLink</span>
          <span>Built for UK residential property transactions</span>
        </div>
      </footer>
    </div>
  );
}
