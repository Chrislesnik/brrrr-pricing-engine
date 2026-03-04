# Current Storage State - Analysis

**Date:** 2026-02-06
**Database:** brrrr-pricing-engine-dev

---

## What I Need to Verify

To properly understand your current storage implementation, please run `CHECK_STORAGE_BUCKETS.sql` in Supabase Dashboard and share the results.

This will show me:
1. ✅ Which buckets actually exist
2. ✅ Their configuration (public/private, size limits, MIME types)
3. ✅ How many files are in each bucket
4. ✅ What RLS policies are active

---

## What I Found in Your Code

### **Storage Buckets Referenced:**

Based on code analysis, your application currently references:

1. **`deals`** - Deal documents ⭐ PRIMARY USE
   - Files: `/api/deals/[id]/documents/route.ts`
   - Upload, download, delete functionality
   - Private bucket
   - Connected to `document_files` table

2. **`broker-assets`** - Company logos (working)
   - Files: `/api/org/company-branding/route.ts`
   - Public bucket
   - Active uploads/downloads

3. **`credit-reports`** - Credit reports (working)
   - Files: `/api/credit/run/route.ts`, `/api/credit-reports/route.ts`
   - Private bucket with signed URLs

4. **`program-docs`** - Program PDFs (working)
   - Files: `/settings/programs-actions.ts`, `/api/programs/[id]/documents/*`
   - Private bucket

---

## Your Desired 3-Bucket Structure

You want:
- ✅ `persons` - For person-related documents (borrowers, individuals)
- ✅ `companies` - For company-related documents (entities, organizations)
- ✅ `deals` - For deal-specific documents

**Current vs Desired:**

| Current Bucket | Should Map To | Purpose |
|----------------|---------------|---------|
| `deals` | `deals` ✅ | Deal documents |
| `broker-assets` | `companies` ? | Company logos, branding |
| `credit-reports` | `persons` ? | Individual credit reports |
| `program-docs` | `companies` ? | Program documentation |

---

## Questions to Clarify

### 1. **Bucket Mapping:**
- Where should broker logos go? `companies` bucket?
- Where should credit reports go? `persons` bucket?
- Where should program docs go? `companies` bucket?

### 2. **Current "documents" Bucket:**
- Is this bucket currently being used?
- Should it be migrated/deprecated?
- Any files in it currently?

### 3. **Migration Strategy:**
- Do you want to migrate existing files to new buckets?
- Or start fresh with the 3-bucket structure?

---

## What I Need From You

**Please run `CHECK_STORAGE_BUCKETS.sql` and share:**

1. **Which buckets currently exist?**
   ```
   id | name | public | file_size_limit | ...
   ```

2. **How many files in each bucket?**
   ```
   bucket_id | file_count | total_size
   ```

3. **What storage policies exist?**
   ```
   policyname | operation
   ```

This will let me see the **actual current state** instead of guessing from migrations/code.

---

## Once I Know the Current State

I can help you:
1. Create the 3 new buckets (persons, companies, deals)
2. Migrate existing references in code
3. Update storage policies
4. Move any existing files if needed
5. Update documentation to match reality

---

**Run the check SQL and share the results, then I'll have accurate information to work with!** 🔍
