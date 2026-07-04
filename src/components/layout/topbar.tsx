"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
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
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none text-foreground">
            Jordan Blake
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Blake &amp; Co. Estate Agents
          </p>
        </div>
        <Avatar>
          <AvatarFallback>JB</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
