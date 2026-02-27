-- Widen the action CHECK constraint to include Liveblocks room permission types:
--   room_write          → ["room:write"]             (full access)
--   room_read           → ["room:read"]              (view storage only)
--   room_presence_write → ["room:presence:write"]    (edit presence only)
--   room_private        → []                         (no access)

ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_action_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_action_check
    CHECK (action = ANY (ARRAY[
      'select'::text,
      'insert'::text,
      'update'::text,
      'delete'::text,
      'all'::text,
      'submit'::text,
      'view'::text,
      'room_write'::text,
      'room_read'::text,
      'room_presence_write'::text,
      'room_private'::text
    ])) NOT VALID;

ALTER TABLE public.organization_policies
  VALIDATE CONSTRAINT organization_policies_action_check;
