-- =====================================================
-- Migration: Improve can_access_document() and helper functions
-- Date: 2026-02-10
-- Description:
--   1. Fix auth.uid() → auth.jwt() ->> 'sub' in get_clerk_user_id()
--   2. Expand org admin access beyond view-only
--   3. Allow uploader to delete own docs
--   4. Add early exit for missing document
--   5. Refactor to plpgsql for single org_id resolution
-- =====================================================

BEGIN;

-- =====================================================
-- Fix 1: Update get_clerk_user_id() to use JWT sub
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.jwt() ->> 'sub';
$$;

COMMENT ON FUNCTION public.get_clerk_user_id() IS
'Returns the Clerk user ID (text) from JWT sub claim';

-- =====================================================
-- Fix 2-5: Rewrite can_access_document() with all improvements
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_document(
  p_document_file_id bigint,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
  v_doc_category_id bigint;
  v_uploaded_by text;
  v_uploaded_at timestamptz;
  v_doc_exists boolean;
BEGIN
  -- Resolve user and org once (performance improvement)
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  -- Validate action
  IF p_action NOT IN ('view', 'insert', 'upload', 'delete') THEN
    RETURN false;
  END IF;

  -- Load document metadata
  SELECT
    true,
    document_category_id,
    uploaded_by,
    uploaded_at
  INTO
    v_doc_exists,
    v_doc_category_id,
    v_uploaded_by,
    v_uploaded_at
  FROM public.document_files
  WHERE id = p_document_file_id;

  -- Early exit: document doesn't exist
  IF NOT COALESCE(v_doc_exists, false) THEN
    RETURN false;
  END IF;

  -- Check 1: Internal admin bypass
  IF public.is_internal_admin() THEN
    RETURN true;
  END IF;

  -- Check 2: Org admin has FULL access to org-linked docs (not just view)
  IF v_org_id IS NOT NULL
    AND public.is_org_admin(v_org_id)
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_orgs dfco
      WHERE dfco.document_file_id = p_document_file_id
        AND dfco.clerk_org_id = v_org_id
    )
  THEN
    RETURN true;
  END IF;

  -- Check 3: Uploader can view their own docs
  IF p_action = 'view' AND v_uploaded_by = v_user_id THEN
    RETURN true;
  END IF;

  -- Check 4: Uploader can delete their own docs
  IF p_action = 'delete' AND v_uploaded_by = v_user_id THEN
    RETURN true;
  END IF;

  -- Check 5: Uploader can upload to their own fresh (unfinalized) doc
  IF p_action = 'upload'
    AND v_uploaded_by = v_user_id
    AND v_uploaded_at IS NULL
  THEN
    RETURN true;
  END IF;

  -- Check 6: Direct user link can view
  IF p_action = 'view'
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_users dfcu
      WHERE dfcu.document_file_id = p_document_file_id
        AND dfcu.clerk_user_id = v_user_id
    )
  THEN
    RETURN true;
  END IF;

  -- Check 7: Org member can view org-linked docs
  IF p_action = 'view'
    AND v_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_orgs dfco
      JOIN public.organization_members m
        ON m.organization_id = dfco.clerk_org_id
       AND m.user_id = v_user_id
      WHERE dfco.document_file_id = p_document_file_id
        AND dfco.clerk_org_id = v_org_id
    )
  THEN
    RETURN true;
  END IF;

  -- Check 8: Deal-derived permission via RBAC matrix
  IF v_doc_category_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.document_file_deal_ids(p_document_file_id) d
      WHERE public.can_access_deal_document(d.deal_id, v_doc_category_id, p_action)
    )
  THEN
    RETURN true;
  END IF;

  -- Default: deny
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_access_document(bigint, text) IS
'Checks if current user can access a document file. Resolves access via multiple paths: internal admin, org admin, uploader, direct link, org link, or deal-derived RBAC permissions.';

-- =====================================================
-- Also fix can_access_deal_document() to use jwt sub
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_deal_document(
  p_deal_id uuid,
  p_document_category_id bigint,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
BEGIN
  -- Resolve once
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  -- Validate action
  IF p_action NOT IN ('view', 'insert', 'upload', 'delete') THEN
    RETURN false;
  END IF;

  -- Internal admin bypass
  IF public.is_internal_admin() THEN
    RETURN true;
  END IF;

  -- Must have active org
  IF v_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Must be member of active org
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.user_id = v_user_id
      AND m.organization_id = v_org_id
  ) THEN
    RETURN false;
  END IF;

  -- Deal must belong to active org (if mapping exists)
  IF EXISTS (
    SELECT 1 FROM public.deals_clerk_orgs dorg
    WHERE dorg.deal_id = p_deal_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.deals_clerk_orgs dorg
    WHERE dorg.deal_id = p_deal_id
      AND dorg.clerk_org_id = v_org_id
  ) THEN
    RETURN false;
  END IF;

  -- Org admin bypass (after deal-org validation)
  IF public.is_org_admin(v_org_id) THEN
    RETURN true;
  END IF;

  -- RBAC matrix check: user's deal role + document category + action
  RETURN EXISTS (
    SELECT 1
    FROM public.deal_roles dr
    JOIN public.document_access_permissions dap
      ON dap.clerk_org_id = v_org_id
     AND dap.deal_role_types_id = dr.deal_role_types_id
     AND dap.document_categories_id = p_document_category_id
    WHERE dr.deal_id = p_deal_id
      AND dr.users_id = public.get_current_user_id()
      AND (
        (p_action = 'view'   AND dap.can_view)
        OR (p_action = 'insert' AND dap.can_insert)
        OR (p_action = 'upload' AND dap.can_upload)
        OR (p_action = 'delete' AND dap.can_delete)
      )
  );
END;
$$;

COMMENT ON FUNCTION public.can_access_deal_document(uuid, bigint, text) IS
'Checks deal-level document access using org membership, deal-org mapping, and RBAC permissions matrix.';

-- =====================================================
-- Update get_current_user_id() to use jwt sub too
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id
  FROM public.users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- =====================================================
-- Verification
-- =====================================================
DO $$
BEGIN
  -- Verify functions exist
  PERFORM public.get_clerk_user_id();
  RAISE NOTICE 'get_clerk_user_id() OK';

  RAISE NOTICE 'All functions updated successfully';
END $$;

COMMIT;

-- =====================================================
-- Changes summary:
-- 1. get_clerk_user_id(): auth.uid()::text → auth.jwt() ->> 'sub'
-- 2. get_current_user_id(): auth.uid()::text → auth.jwt() ->> 'sub'
-- 3. can_access_document(): Rewritten in plpgsql with:
--    a. Single resolution of org_id and user_id (performance)
--    b. Early exit for missing documents
--    c. Org admin: full access (not just view) for org-linked docs
--    d. Uploader: can delete own docs (new)
--    e. All auth checks use v_user_id (jwt sub) consistently
-- 4. can_access_deal_document(): Rewritten in plpgsql with:
--    a. Single resolution of org_id and user_id
--    b. Early returns instead of nested AND/OR
--    c. Consistent jwt sub usage
-- =====================================================
