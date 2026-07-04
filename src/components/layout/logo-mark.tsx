import { cn } from "@/lib/utils";

/**
 * Custom logo mark: two interlocking rounded links.
 * This is ChainLink's one signature visual motif — used small and
 * consistently (sidebar, marketing nav, auth screen) rather than repeated
 * decoratively elsewhere.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="10"
        width="16"
        height="12"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <rect
        x="13"
        y="10"
        width="16"
        height="12"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.25"
        className="text-brand"
        opacity="0.55"
      />
    </svg>
  );
}

export function LogoWithWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="h-6 w-6 text-primary" />
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        ChainLink
      </span>
    </div>
  );
}
