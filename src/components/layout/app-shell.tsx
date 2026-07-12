"use client";

import { useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import type { WorkspaceContext } from "@/types/workspace";

/**
 * Shared shell for all authenticated app routes (dashboard, chains, tasks,
 * documents, settings).
 *
 * NOTE: this is intentionally one shell for now. Per docs/ARCHITECTURE.md,
 * the chain workspace and business workspace will eventually have somewhat
 * different navigation needs — when that diverges in Phase 2/3, split this
 * into (chain) and (business) route groups with their own shells rather than
 * branching this component internally.
 */
export function AppShell({
  children,
  profile,
  workspace,
  unreadCount,
}: {
  children: React.ReactNode;
  profile: { full_name: string | null; email: string } | null;
  workspace: WorkspaceContext;
  unreadCount: number;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f5f7f7]">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" workspace={workspace} />

      {/* Mobile sidebar drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-foreground/20"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <Sidebar
            className={cn("relative z-50 flex")}
            onNavigate={() => setMobileNavOpen(false)}
            workspace={workspace}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          profile={profile}
          unreadCount={unreadCount}
          workspace={workspace}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
