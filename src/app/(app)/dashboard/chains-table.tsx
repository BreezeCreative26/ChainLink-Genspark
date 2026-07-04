import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ChainRow, RiskReason } from "@/types/dashboard";

const RISK_LABELS: Record<RiskReason, string> = {
  overdue_milestone: "Overdue milestone",
  no_recent_activity: "No activity in 14+ days",
  stalled: "Marked stalled",
};

const STATUS_VARIANT: Record<ChainRow["status"], "success" | "secondary" | "outline" | "destructive"> = {
  active: "success",
  stalled: "destructive",
  completed: "secondary",
  fallen_through: "outline",
};

export function ChainsTable({ chains }: { chains: ChainRow[] }) {
  if (chains.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        No chains match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Chain</th>
            <th className="py-2 pr-4 font-medium">Address</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Risk</th>
            <th className="py-2 font-medium">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {chains.map((chain) => (
            <tr key={chain.id} className="border-b border-border last:border-0">
              <td className="py-2.5 pr-4">
                <Link
                  href={`/chains/${chain.id}`}
                  className="font-mono text-xs font-medium text-primary hover:underline"
                >
                  {chain.chainRef}
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-foreground">
                {chain.addressLine1 ?? "—"}
                {chain.city ? `, ${chain.city}` : ""}
              </td>
              <td className="py-2.5 pr-4">
                <Badge variant={STATUS_VARIANT[chain.status]} className="text-[10px]">
                  {chain.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="py-2.5 pr-4">
                {chain.riskReasons.length > 0 ? (
                  <span
                    className="flex items-center gap-1 text-xs text-destructive"
                    title={chain.riskReasons.map((r) => RISK_LABELS[r]).join(", ")}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {chain.riskReasons.length}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-2.5 text-xs text-muted-foreground">
                {chain.lastActivityAt
                  ? new Date(chain.lastActivityAt).toLocaleDateString("en-GB")
                  : "No activity"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
