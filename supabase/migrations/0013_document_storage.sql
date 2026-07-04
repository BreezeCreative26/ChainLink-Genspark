-- ChainLink schema: 0013 — document storage
--
-- Binary content lives in Supabase Storage; the `documents` table (0006)
-- holds metadata only. Upload path convention: `{chain_id}/{uuid}-{filename}`
-- — the chain_id folder segment is what the insert policy checks against.
--
-- Download/select authorization can't rely on the folder-name convention
-- alone (a determined guest could otherwise probe other chains' folders by
-- guessing UUIDs) — it joins back to the documents table row for the real
-- visibility check, mirroring documents_select from 0008 exactly.

insert into storage.buckets (id, name, public)
values ('chain-documents', 'chain-documents', false)
on conflict (id) do nothing;

create policy chain_documents_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'chain-documents'
    and (storage.foldername(name))[1] is not null
    and is_chain_member(((storage.foldername(name))[1])::uuid)
  );

create policy chain_documents_storage_select on storage.objects
  for select
  using (
    bucket_id = 'chain-documents'
    and exists (
      select 1 from documents d
      where d.storage_path = storage.objects.name
        and is_chain_member(d.chain_id)
        and (d.visibility = 'shared' or is_org_member(d.organisation_id))
    )
  );
