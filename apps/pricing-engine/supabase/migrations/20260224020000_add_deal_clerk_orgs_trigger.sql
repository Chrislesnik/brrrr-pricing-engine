-- Automatically maintain deal_clerk_orgs when role_assignments change.
-- deal_clerk_orgs maps deals → orgs that have members assigned to deal roles.

-- 1. Ensure deal_clerk_orgs has the columns we need (it already exists with
--    id, deal_id, clerk_org_id). Add a unique constraint if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deal_clerk_orgs_deal_id_clerk_org_id_key'
  ) THEN
    ALTER TABLE public.deal_clerk_orgs
      ADD CONSTRAINT deal_clerk_orgs_deal_id_clerk_org_id_key
      UNIQUE (deal_id, clerk_org_id);
  END IF;
END $$;

-- 2. Backfill deal_clerk_orgs from existing role_assignments.
-- Join through organization_members to find which orgs have members on each deal.
-- Filter to deals that still exist to avoid FK violations from orphaned assignments.
INSERT INTO public.deal_clerk_orgs (deal_id, clerk_org_id)
SELECT DISTINCT
  ra.resource_id::uuid AS deal_id,
  om.organization_id AS clerk_org_id
FROM public.role_assignments ra
JOIN public.organization_members om
  ON om.user_id = ra.user_id
JOIN public.deals d
  ON d.id = ra.resource_id::uuid
WHERE ra.resource_type = 'deal'
  AND ra.resource_id IS NOT NULL
  AND om.organization_id IS NOT NULL
ON CONFLICT (deal_id, clerk_org_id) DO NOTHING;

-- 3. Function: sync deal_clerk_orgs after role_assignment INSERT
CREATE OR REPLACE FUNCTION public.sync_deal_clerk_orgs_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.resource_type = 'deal' THEN
    INSERT INTO public.deal_clerk_orgs (deal_id, clerk_org_id)
    SELECT DISTINCT
      NEW.resource_id::uuid,
      om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id
      AND om.organization_id IS NOT NULL
    ON CONFLICT (deal_id, clerk_org_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Function: clean up deal_clerk_orgs after role_assignment DELETE
CREATE OR REPLACE FUNCTION public.sync_deal_clerk_orgs_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF OLD.resource_type = 'deal' THEN
    FOR v_org_id IN
      SELECT DISTINCT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = OLD.user_id
        AND om.organization_id IS NOT NULL
    LOOP
      -- Only remove if no other members of this org have roles on this deal
      IF NOT EXISTS (
        SELECT 1
        FROM public.role_assignments ra
        JOIN public.organization_members om2
          ON om2.user_id = ra.user_id
        WHERE ra.resource_type = 'deal'
          AND ra.resource_id = OLD.resource_id
          AND om2.organization_id = v_org_id
          AND ra.id != OLD.id
      ) THEN
        DELETE FROM public.deal_clerk_orgs
        WHERE deal_id = OLD.resource_id::uuid
          AND clerk_org_id = v_org_id;
      END IF;
    END LOOP;
  END IF;
  RETURN OLD;
END;
$$;

-- 5. Create triggers
DROP TRIGGER IF EXISTS trg_sync_deal_clerk_orgs_insert ON public.role_assignments;
CREATE TRIGGER trg_sync_deal_clerk_orgs_insert
  AFTER INSERT ON public.role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_deal_clerk_orgs_on_insert();

DROP TRIGGER IF EXISTS trg_sync_deal_clerk_orgs_delete ON public.role_assignments;
CREATE TRIGGER trg_sync_deal_clerk_orgs_delete
  AFTER DELETE ON public.role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_deal_clerk_orgs_on_delete();
