"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged client-side for now; wiring this to a real error-tracking
    // service (Sentry or similar) is a Phase 3/4 deployment-readiness item
    // — see docs/DECISIONS.md.
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. This has been logged — try again,
            or head back to your chains.
          </p>
          <div className="flex gap-2 pt-2">
            <Button onClick={reset} size="sm">
              Try again
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/chains">Back to chains</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
