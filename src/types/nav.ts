import type { LucideIcon } from "lucide-react";

/**
 * UI-only navigation types for the app shell.
 *
 * NOTE: Domain types (Chain, Milestone, Task, etc. — see
 * docs/ARCHITECTURE.md "Data Model Overview") are intentionally not defined
 * yet. They'll be introduced alongside the Supabase schema in the Phase 1
 * data-model step, not in this foundation-only scaffold.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
