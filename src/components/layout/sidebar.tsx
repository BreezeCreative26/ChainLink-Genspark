"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Link2,
  ListChecks,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoWithWordmark } from "@/components/layout/logo-mark";
import type { NavItem } from "@/types/nav";
import type { WorkspaceContext } from "@/types/workspace";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  workspace: WorkspaceContext;
}

export function Sidebar({ className, onNavigate, workspace }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = workspace.canViewBusinessDashboard
    ? [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Chains", href: "/chains", icon: Link2 },
        { label: "Work queue", href: "/tasks", icon: ListChecks },
        { label: "Documents", href: "/documents", icon: FileText },
        { label: "Settings", href: "/settings", icon: Settings },
      ]
    : [
        { label: "My chain", href: "/chains", icon: Link2 },
        { label: "Account", href: "/settings", icon: Settings },
      ];

  return (
    <aside
      className={cn(
        "flex h-full w-[17rem] shrink-0 flex-col border-r border-slate-800 bg-[#102f34] text-white",
        className
      )}
    >
      <div className="flex h-[4.5rem] items-center border-b border-white/10 px-5 [&_a]:text-white [&_svg]:text-teal-300">
        <LogoWithWordmark />
      </div>

      <div className="px-4 pt-5">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {workspace.mode === "firm" ? "Business workspace" : "Personal workspace"}
        </p>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-3" aria-label="Workspace navigation">
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
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-[1.1rem] w-[1.1rem]",
                  isActive ? "text-primary" : "text-white/45 group-hover:text-teal-300"
                )}
                strokeWidth={1.9}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section className="m-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-300/15 text-teal-200">
            {workspace.mode === "firm" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              {workspace.organisationName ?? workspace.roleLabel}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-white/45">
              {workspace.branchName ?? workspace.roleLabel}
            </p>
          </div>
        </div>
        {workspace.mode === "participant" && (
          <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-4 text-white/45">
            Your access is limited to shared information in chains you have joined.
          </p>
        )}
      </section>
    </aside>
  );
}
