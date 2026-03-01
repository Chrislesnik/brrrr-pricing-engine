-- =====================================================
-- Migration: Add api_key to organization_policies.resource_type
-- Date: 2026-03-01
-- Description:
--   Expand resource_type CHECK constraint to include 'api_key'.
--
-- api_key policies control which data resources can be accessed
-- via Clerk API keys, and which scopes are available when creating keys.
-- =====================================================

BEGIN;

ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_resource_type_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_resource_type_check
  CHECK (resource_type = ANY (ARRAY[
    'table'::text,
    'storage_bucket'::text,
    'feature'::text,
    'route'::text,
    'liveblocks'::text,
    'api_key'::text
  ]));

ALTER TABLE public.organization_policies
  VALIDATE CONSTRAINT organization_policies_resource_type_check;

COMMIT;
