import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { resolveDashboardScope } from "@/server/services/dashboard";
import * as dashboardRepo from "@/server/repositories/dashboard.repository";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function getWorkQueue(
  supabase: TypedClient,
  requestedBranchId?: string
) {
  const scope = await resolveDashboardScope(supabase, requestedBranchId);
  if (scope.chainIds.length === 0) return { scope, items: [] };

  const [tasksResult, milestonesResult, chains] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, chain_id, title, status, due_date, visibility")
      .in("chain_id", scope.chainIds)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .from("milestones")
      .select("id, chain_id, title, status, due_date, visibility")
      .in("chain_id", scope.chainIds)
      .neq("status", "completed")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(100),
    dashboardRepo.listChainsSummary(supabase, scope.chainIds),
  ]);

  if (tasksResult.error) throw tasksResult.error;
  if (milestonesResult.error) throw milestonesResult.error;

  const chainById = new Map(
    chains.map((chain) => {
      const property = Array.isArray(chain.properties)
        ? chain.properties[0]
        : chain.properties;
      return [
        chain.id,
        {
          chainRef: chain.chain_ref,
          address: property?.address_line1 ?? null,
        },
      ];
    })
  );

  const items = [
    ...tasksResult.data.map((task) => ({
      ...task,
      kind: "task" as const,
      chainRef: chainById.get(task.chain_id)?.chainRef ?? "",
      address: chainById.get(task.chain_id)?.address ?? null,
    })),
    ...milestonesResult.data.map((milestone) => ({
      ...milestone,
      kind: "milestone" as const,
      chainRef: chainById.get(milestone.chain_id)?.chainRef ?? "",
      address: chainById.get(milestone.chain_id)?.address ?? null,
    })),
  ].sort((a, b) => {
    if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title);
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

  return { scope, items };
}

export async function getDocumentLibrary(
  supabase: TypedClient,
  requestedBranchId?: string
) {
  const scope = await resolveDashboardScope(supabase, requestedBranchId);
  if (scope.chainIds.length === 0) return { scope, documents: [] };

  const [documentsResult, chains] = await Promise.all([
    supabase
      .from("documents")
      .select("id, chain_id, title, category, mime_type, size_bytes, visibility, created_at")
      .in("chain_id", scope.chainIds)
      .order("created_at", { ascending: false })
      .limit(200),
    dashboardRepo.listChainsSummary(supabase, scope.chainIds),
  ]);

  if (documentsResult.error) throw documentsResult.error;

  const chainById = new Map(
    chains.map((chain) => {
      const property = Array.isArray(chain.properties)
        ? chain.properties[0]
        : chain.properties;
      return [
        chain.id,
        {
          chainRef: chain.chain_ref,
          address: property?.address_line1 ?? null,
        },
      ];
    })
  );

  return {
    scope,
    documents: documentsResult.data.map((document) => ({
      ...document,
      chainRef: chainById.get(document.chain_id)?.chainRef ?? "",
      address: chainById.get(document.chain_id)?.address ?? null,
    })),
  };
}
