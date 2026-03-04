# Table Rename: deals_clerk_orgs → deal_clerk_orgs

## Summary

Renamed `deals_clerk_orgs` to `deal_clerk_orgs` for naming consistency (singular "deal" instead of plural "deals").

---

## Changes Made

### ✅ 1. SQL Migration Created

**File:** `RENAME_DEALS_CLERK_ORGS_TABLE.sql`

**What it does:**
- Renames table from `deals_clerk_orgs` to `deal_clerk_orgs`
- Updates all constraints (PK, FK, UNIQUE)
- Renames all indexes
- Updates `can_access_deal_document()` function to use new table name

### ✅ 2. Code References Updated

**Updated Files:**
1. ✅ `apps/pricing-engine/src/lib/deal-access.ts` (line 68)
   - Changed: `.from("deals_clerk_orgs")` → `.from("deal_clerk_orgs")`
   
2. ✅ `apps/pricing-engine/src/app/api/pipeline/route.ts` (line 132)
   - Changed: `.from("deals_clerk_orgs")` → `.from("deal_clerk_orgs")`

**Not Updated (intentional):**
- Old migration files (preserve history)
- `database.types.ts` (will be regenerated)

---

## Database Objects Affected

### Table
- `deals_clerk_orgs` → `deal_clerk_orgs`

### Constraints
- `deals_orgs_pkey` → `deal_orgs_pkey`
- `deals_orgs_deal_id_clerk_org_id_key` → `deal_orgs_deal_id_clerk_org_id_key`
- `deals_clerk_orgs_clerk_org_id_fkey` → `deal_clerk_orgs_clerk_org_id_fkey`
- `deals_clerk_orgs_deal_id_fkey` → `deal_clerk_orgs_deal_id_fkey`

### Indexes
- `idx_deals_orgs_clerk_org_id` → `idx_deal_orgs_clerk_org_id`
- `idx_deals_orgs_deal_id` → `idx_deal_orgs_deal_id`

### Functions Updated
- `can_access_deal_document(uuid, uuid)` - Updated all references from `deals_clerk_orgs` to `deal_clerk_orgs`

---

## How to Apply

### Option 1: Supabase CLI (Recommended)
```bash
# From project root
psql "$(npx supabase status | grep 'DB URL' | cut -d: -f2- | xargs)" -f RENAME_DEALS_CLERK_ORGS_TABLE.sql
```

### Option 2: Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy contents of `RENAME_DEALS_CLERK_ORGS_TABLE.sql`
4. Paste and execute

### Option 3: Direct psql
```bash
psql "your-connection-string" -f RENAME_DEALS_CLERK_ORGS_TABLE.sql
```

---

## Post-Migration Steps

### 1. Regenerate TypeScript Types
```bash
cd apps/pricing-engine
npm run db:generate-types
# or
npx supabase gen types typescript --local > src/types/database.types.ts
```

### 2. Verify Changes
```sql
-- Verify table exists with new name
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'deal_clerk_orgs';

-- Verify old table doesn't exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'deals_clerk_orgs';

-- Check constraints
SELECT conname FROM pg_constraint 
WHERE conrelid = 'public.deal_clerk_orgs'::regclass;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'deal_clerk_orgs';
```

### 3. Test Application
```bash
# Start dev server
pnpm dev:pricing

# Test deal access
# - Navigate to deals pipeline
# - Verify deals load correctly
# - Check organization filtering works
```

---

## Rollback Plan

If you need to rollback:

```sql
BEGIN;

-- Rename table back
ALTER TABLE public.deal_clerk_orgs RENAME TO deals_clerk_orgs;

-- Rename constraints back
ALTER TABLE public.deals_clerk_orgs 
  RENAME CONSTRAINT deal_orgs_pkey TO deals_orgs_pkey;

ALTER TABLE public.deals_clerk_orgs 
  RENAME CONSTRAINT deal_orgs_deal_id_clerk_org_id_key 
  TO deals_orgs_deal_id_clerk_org_id_key;

ALTER TABLE public.deals_clerk_orgs 
  RENAME CONSTRAINT deal_clerk_orgs_clerk_org_id_fkey 
  TO deals_clerk_orgs_clerk_org_id_fkey;

ALTER TABLE public.deals_clerk_orgs 
  RENAME CONSTRAINT deal_clerk_orgs_deal_id_fkey 
  TO deals_clerk_orgs_deal_id_fkey;

-- Rename indexes back
ALTER INDEX idx_deal_orgs_clerk_org_id 
  RENAME TO idx_deals_orgs_clerk_org_id;

ALTER INDEX idx_deal_orgs_deal_id 
  RENAME TO idx_deals_orgs_deal_id;

COMMIT;
```

Then revert code changes:
```bash
git checkout apps/pricing-engine/src/lib/deal-access.ts
git checkout apps/pricing-engine/src/app/api/pipeline/route.ts
```

---

## Files Modified

### New Files (2)
1. `RENAME_DEALS_CLERK_ORGS_TABLE.sql` - Migration script
2. `RENAME_TABLE_SUMMARY.md` - This file

### Modified Files (2)
1. `apps/pricing-engine/src/lib/deal-access.ts`
2. `apps/pricing-engine/src/app/api/pipeline/route.ts`

### Files to Regenerate (1)
1. `apps/pricing-engine/src/types/database.types.ts` (after running migration)

---

## Testing Checklist

After applying migration:

- [ ] Migration runs without errors
- [ ] Table `deal_clerk_orgs` exists
- [ ] Old table `deals_clerk_orgs` does not exist
- [ ] All constraints renamed correctly
- [ ] All indexes renamed correctly
- [ ] TypeScript types regenerated
- [ ] Application starts without errors
- [ ] Deals pipeline loads
- [ ] Deal access control works
- [ ] Organization filtering works
- [ ] No database errors in logs

---

## Impact Assessment

**Risk Level:** Low  
**Downtime Required:** None (if using proper deployment)  
**Breaking Changes:** None (database-level rename only)  
**Affected Features:**
- Deal access control
- Organization-based deal filtering
- Deal pipeline API

---

**Status:** Ready to Apply  
**Next Step:** Run the SQL migration
