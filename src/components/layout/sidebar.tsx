"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  ListChecks,
  FileText,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoWithWordmark } from "@/components/layout/logo-mark";
import type { NavItem } from "@/types/nav";

const ALL_NAV_ITEMS: (NavItem & { requiresProfessionalStanding?: boolean })[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiresProfessionalStanding: true,
  },
  { label: "Chains", href: "/chains", icon: Link2 },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  showDashboard: boolean;
}

export function Sidebar({ className, onNavigate, showDashboard }: SidebarProps) {
  const pathname = usePathname();

  // Dashboard is the business workspace — a pure guest (no connected/proxy
  // standing anywhere) never sees it, per docs/OPERATING_MODEL.md ("Guest
  // User Logic": no dashboard, no cross-chain view).
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.requiresProfessionalStanding || showDashboard
  );

  return (
    <aside
      className={cn(
        "flex h-full w-60 shrink-0 flex-col border-r border-border bg-card",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <LogoWithWordmark />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
