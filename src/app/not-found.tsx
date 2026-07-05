import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoWithWordmark } from "@/components/layout/logo-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary/40 px-4 text-center">
      <LogoWithWordmark />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          That page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
