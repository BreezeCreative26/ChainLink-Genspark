"use client";

import Link from "next/link";
import { Bell, ChevronRight, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(app)/actions";
import type { WorkspaceContext } from "@/types/workspace";

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function Topbar({
  onMenuClick,
  profile,
  unreadCount,
  workspace,
}: {
  onMenuClick: () => void;
  profile: { full_name: string | null; email: string } | null;
  unreadCount: number;
  workspace: WorkspaceContext;
}) {
  return (
    <header className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl md:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          <span className="font-medium text-foreground">
            {workspace.organisationName ?? "ChainLink"}
          </span>
          {workspace.branchName && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{workspace.branchName}</span>
            </>
          )}
          <span className="ml-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
            {workspace.roleLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label={`${unreadCount} unread notifications`}
          className="relative rounded-full"
        >
          <Link href="/notifications">
            <Bell className="h-[1.1rem] w-[1.1rem]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold leading-none text-foreground">
            {profile?.full_name ?? profile?.email ?? "Account"}
          </p>
          <p className="mt-1 max-w-48 truncate text-[11px] text-muted-foreground">
            {profile?.email}
          </p>
        </div>
        <Avatar className="h-9 w-9 border border-border bg-accent">
          <AvatarFallback className="text-xs font-semibold text-accent-foreground">
            {profile ? initials(profile.full_name, profile.email) : "?"}
          </AvatarFallback>
        </Avatar>
        <form action={signOutAction}>
          <Button variant="ghost" size="icon" type="submit" aria-label="Log out" className="rounded-full">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
