import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

export async function listTasksForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, due_date, visibility, organisation_id, created_at")
    .eq("chain_id", chainId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function insertTask(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["tasks"]["Insert"]
) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  supabase: TypedClient,
  taskId: string,
  status: Database["public"]["Tables"]["tasks"]["Row"]["status"]
) {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) throw error;
}
