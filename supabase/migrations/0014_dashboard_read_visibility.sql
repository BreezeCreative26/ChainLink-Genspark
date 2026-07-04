-- ChainLink schema: 0014 — dashboard read visibility
--
-- Every RLS policy up to this point is participant-scoped: you can only
-- see a chain, its milestones, or its activity if YOU personally are on
-- it. But docs/OPERATING_MODEL.md's "Estate Agent Dashboard Logic" and
-- docs/PRODUCT_BRIEF.md's "Business-Level Professional Workspace" both
-- require a firm to see every chain ANY of its members is connected to —
-- that visibility was never actually granted at the database level.
--
-- This migration adds ONLY new SELECT policies, additive to the existing
-- ones (permissive policies OR together). It does not touch any INSERT or
-- UPDATE policy — being able to see a colleague's chain on the firm
-- dashboard does not grant the ability to edit it. That stays governed by
-- whether you are personally a participant on that specific chain, exactly
-- as before.

create or replace function is_org_connected_to_chain(target_chain_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from chain_participants cp
    where cp.chain_id = target_chain_id
      and cp.access_mode = 'connected'
      and cp.status = 'active'
      and cp.organisation_id in (
        select organisation_id from memberships
        where profile_id = auth.uid() and status = 'active'
      )
  );
$$;

create policy chains_select_via_org on chains
  for select using (is_org_connected_to_chain(id));

create policy chain_participants_select_via_org on chain_participants
  for select using (is_org_connected_to_chain(chain_id));

create policy properties_select_via_org on properties
  for select using (is_org_connected_to_chain(chain_id));

create policy chain_nodes_select_via_org on chain_nodes
  for select using (is_org_connected_to_chain(chain_id));

create policy milestones_select_via_org on milestones
  for select using (
    is_org_connected_to_chain(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy tasks_select_via_org on tasks
  for select using (
    is_org_connected_to_chain(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy activity_logs_select_via_org on activity_logs
  for select using (
    is_org_connected_to_chain(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy invitations_select_via_org on invitations
  for select using (is_org_connected_to_chain(chain_id));

create policy documents_select_via_org on documents
  for select using (
    is_org_connected_to_chain(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy notes_select_via_org on notes
  for select using (
    is_org_connected_to_chain(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

-- Storage download must extend the same way, or a firm admin could see a
-- document exists (via documents_select_via_org above) but not open it —
-- an inconsistent, confusing experience. This mirrors
-- chain_documents_storage_select from 0013 exactly, substituting
-- is_org_connected_to_chain for is_chain_member.
create policy chain_documents_storage_select_via_org on storage.objects
  for select
  using (
    bucket_id = 'chain-documents'
    and exists (
      select 1 from documents d
      where d.storage_path = storage.objects.name
        and is_org_connected_to_chain(d.chain_id)
        and (d.visibility = 'shared' or is_org_member(d.organisation_id))
    )
  );
