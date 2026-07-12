import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function listDocumentsForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, category, storage_path, visibility, created_at")
    .eq("chain_id", chainId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDocumentById(supabase: TypedClient, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, chain_id, title, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertDocument(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["documents"]["Insert"]
) {
  const { data, error } = await supabase
    .from("documents")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function createSignedDownloadUrl(supabase: TypedClient, storagePath: string) {
  const { data, error } = await supabase.storage
    .from("chain-documents")
    .createSignedUrl(storagePath, 60 * 5); // 5 minutes

  if (error) throw error;
  return data.signedUrl;
}
