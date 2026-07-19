-- ChainLink schema: 0020 — activity write policy
-- Shared/internal audit events may only be written by an active chain member;
-- actor and proxy attribution must reference participants on that same chain.

create policy activity_logs_insert on activity_logs
  for insert with check (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
    and (
      actor_participant_id is null
      or exists (
        select 1 from chain_participants actor
        where actor.id = actor_participant_id
          and actor.chain_id = activity_logs.chain_id
          and actor.status = 'active'
      )
    )
    and (
      on_behalf_of_participant_id is null
      or exists (
        select 1 from chain_participants represented
        where represented.id = on_behalf_of_participant_id
          and represented.chain_id = activity_logs.chain_id
          and represented.status = 'active'
      )
    )
  );
