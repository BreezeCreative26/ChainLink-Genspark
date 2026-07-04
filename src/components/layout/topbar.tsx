"use client";

import { Menu, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(app)/actions";

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
}: {
  onMenuClick: () => void;
  profile: { full_name: string | null; email: string } | null;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {profile && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {profile.full_name ?? profile.email}
            </p>
          </div>
        )}
        <Avatar>
          <AvatarFallback>
            {profile ? initials(profile.full_name, profile.email) : "?"}
          </AvatarFallback>
        </Avatar>
        <form action={signOutAction}>
          <Button variant="ghost" size="icon" type="submit" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
