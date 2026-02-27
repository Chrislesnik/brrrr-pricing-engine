-- =====================================================
-- Migration: Rename liveblocks_room → liveblocks and
--            update resource_name values to room:{entity} pattern
-- Date: 2026-02-24
-- =====================================================

BEGIN;

-- STEP 1: Drop the CHECK constraint so we can update values
ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_resource_type_check;

-- STEP 2: Rename resource_name values
UPDATE public.organization_policies
  SET resource_name = 'room:deal'
  WHERE resource_type = 'liveblocks_room' AND resource_name = 'deal';

UPDATE public.organization_policies
  SET resource_name = 'room:deal_task'
  WHERE resource_type = 'liveblocks_room' AND resource_name = 'task';

UPDATE public.organization_policies
  SET resource_name = 'room:email_template'
  WHERE resource_type = 'liveblocks_room' AND resource_name = 'email-template';

-- STEP 3: Rename resource_type for all liveblocks_room rows
UPDATE public.organization_policies
  SET resource_type = 'liveblocks'
  WHERE resource_type = 'liveblocks_room';

-- STEP 4: Re-add the CHECK constraint with the new value
ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_resource_type_check
  CHECK (resource_type = ANY (ARRAY[
    'table'::text,
    'storage_bucket'::text,
    'feature'::text,
    'route'::text,
    'liveblocks'::text
  ])) NOT VALID;

ALTER TABLE public.organization_policies
  VALIDATE CONSTRAINT organization_policies_resource_type_check;

COMMIT;
