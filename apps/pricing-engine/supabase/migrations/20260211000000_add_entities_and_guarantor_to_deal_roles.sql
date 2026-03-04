-- =====================================================
-- Migration: Add entities_id and guarantor_id to deal_roles
-- Date: 2026-02-11
-- Description:
--   - Add entities_id (UUID, nullable) FK → entities.id ON DELETE CASCADE
--   - Add guarantor_id (BIGINT, nullable) FK → guarantor.id ON DELETE CASCADE
--   - Replace CHECK constraint to enforce exactly one party FK per row
--   - Unify ON DELETE CASCADE across all party FKs
--   - Make deal_id and deal_role_types_id NOT NULL
--   - Add unique partial indexes for new party columns
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Add entities_id column with FK to entities
-- =====================================================
ALTER TABLE public.deal_roles
  ADD COLUMN IF NOT EXISTS entities_id uuid NULL;

ALTER TABLE public.deal_roles
  ADD CONSTRAINT deal_roles_entities_id_fkey
    FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

-- =====================================================
-- PART 2: Add guarantor_id column with FK to guarantor
-- =====================================================
ALTER TABLE public.deal_roles
  ADD COLUMN IF NOT EXISTS guarantor_id bigint NULL;

ALTER TABLE public.deal_roles
  ADD CONSTRAINT deal_roles_guarantor_id_fkey
    FOREIGN KEY (guarantor_id) REFERENCES public.guarantor(id) ON DELETE CASCADE;

-- =====================================================
-- PART 3: Replace CHECK constraint to cover all 4 party columns
-- Enforces exactly one party FK is populated per row
-- =====================================================
ALTER TABLE public.deal_roles
  DROP CONSTRAINT IF EXISTS deal_roles_has_party;

ALTER TABLE public.deal_roles
  ADD CONSTRAINT deal_roles_has_party CHECK (
    (CASE WHEN users_id      IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN contact_id    IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN entities_id   IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN guarantor_id  IS NOT NULL THEN 1 ELSE 0 END) = 1
  );

-- =====================================================
-- PART 4: Unify ON DELETE CASCADE for entities_id and guarantor_id FKs
--   (users_id, contact_id, deal_id already use CASCADE)
--   entities_id and guarantor_id FKs were just created above with CASCADE,
--   so no change needed there. This section is a no-op confirmation.
-- =====================================================

-- =====================================================
-- PART 5: Make deal_id and deal_role_types_id NOT NULL
-- =====================================================
ALTER TABLE public.deal_roles
  ALTER COLUMN deal_id SET NOT NULL;

ALTER TABLE public.deal_roles
  ALTER COLUMN deal_role_types_id SET NOT NULL;

-- =====================================================
-- PART 6: Add partial indexes for new FK columns
-- =====================================================
CREATE INDEX IF NOT EXISTS deal_roles_entities_id_idx
  ON public.deal_roles USING btree (entities_id)
  TABLESPACE pg_default
  WHERE (entities_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS deal_roles_guarantor_id_idx
  ON public.deal_roles USING btree (guarantor_id)
  TABLESPACE pg_default
  WHERE (guarantor_id IS NOT NULL);

-- =====================================================
-- PART 7: Add unique partial indexes for new party columns
-- Prevents duplicate role assignments for same entity/guarantor on a deal
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS deal_roles_unique_entity_role
  ON public.deal_roles USING btree (deal_id, deal_role_types_id, entities_id)
  TABLESPACE pg_default
  WHERE (entities_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS deal_roles_unique_guarantor_role
  ON public.deal_roles USING btree (deal_id, deal_role_types_id, guarantor_id)
  TABLESPACE pg_default
  WHERE (guarantor_id IS NOT NULL);

COMMIT;

-- =====================================================
-- Post-migration summary:
--   deal_roles table now has 4 party FK columns:
--     - users_id      (bigint)  → users.id      ON DELETE CASCADE
--     - contact_id    (bigint)  → contact.id     ON DELETE CASCADE
--     - entities_id   (uuid)    → entities.id    ON DELETE CASCADE
--     - guarantor_id  (bigint)  → guarantor.id   ON DELETE CASCADE
--   CHECK constraint: exactly one party FK must be populated
--   deal_id and deal_role_types_id are now NOT NULL
--   Unique partial indexes on all 4 party columns prevent duplicate assignments
-- =====================================================
