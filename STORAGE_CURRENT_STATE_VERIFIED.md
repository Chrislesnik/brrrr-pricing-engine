# Storage Current State - VERIFIED ✅

**Date:** 2026-02-10  
**Database:** brrrr-pricing-engine-dev  
**Source:** Live database query results

---

## 🎯 Current Buckets (All 5)

### **Your Desired 3 Buckets - ALREADY EXIST! ✅**

1. **`persons`** ✅
   - Private
   - 50 MB limit
   - **No MIME restrictions** (allows any file type)
   - Created: Feb 2, 2026
   - **Current files: 0**

2. **`companies`** ✅
   - Private
   - 50 MB limit
   - Allowed: PDF, images, text, zip
   - Created: Feb 2, 2026
   - **Current files: 0**

3. **`deals`** ✅
   - Private
   - 50 MB limit
   - Allowed: PDF, images, text, zip
   - Created: Feb 2, 2026
   - **Current files: 0**

---

### **Legacy Buckets (To Be Migrated/Deprecated)**

4. **`documents`** ⚠️ LEGACY
   - Private
   - 50 MB limit
   - Allowed: PDF, images, text, zip
   - Created: Jan 29, 2026
   - **Current files: 1** (deal PDF)
   - Path: `deals/d50d84b5-49a3-4bd6-b6f8-30ff78ba304d/2LnZcOWkucjQ_PH6wfoeG.pdf`

5. **`org-assets`** ⚠️ LEGACY
   - **Public** (only public bucket!)
   - No size limit
   - No MIME restrictions
   - Created: Feb 8, 2026
   - **Current files: 2** (whitelabel logos)
   - Paths:
     - `whitelabel-logos/{orgId}/dark-{timestamp}-{filename}.png`
     - `whitelabel-logos/{orgId}/light-{timestamp}-{filename}.png`

---

## Code vs Database Mismatch

### **Issue #1: Company Logos**

**Code references:**
```typescript
// In /api/org/company-branding/route.ts
.storage.from("broker-assets")
```

**Database reality:**
- Bucket name: `org-assets` (not broker-assets!)
- Files are IN this bucket
- **Question:** How is code working if bucket names don't match?

**Migration needed:**
- Move 2 logo files: `org-assets` → `companies`
- Update code: `broker-assets` → `companies`

---

### **Issue #2: Deal Documents**

**Code references:**
```typescript
// In /api/deals/[id]/documents/route.ts
.storage.from("deals")
```

**Database reality:**
- Bucket `deals` EXISTS but is EMPTY
- Files are in `documents` bucket instead!
- Path structure already uses `deals/` prefix

**Migration needed:**
- Move 1 PDF file: `documents/deals/...` → `deals/...`
- Code already correct (references `deals`)
- Just need to move the file

---

## Current File Inventory

### **Total: 3 files across 2 buckets**

| File | Bucket | Size | Type | Purpose |
|------|--------|------|------|---------|
| `whitelabel-logos/.../dark-...png` | org-assets | 21 KB | PNG | Dark theme logo |
| `whitelabel-logos/.../light-...png` | org-assets | 37 KB | PNG | Light theme logo |
| `deals/d50d84b5-.../2LnZcOWk....pdf` | documents | 240 KB | PDF | Deal document |

---

## Migration Plan (When Ready)

### **Step 1: Create Migration Script**

```sql
-- Move files from old buckets to new buckets
-- This will be done via Supabase Storage API, not SQL
```

### **Step 2: File Migrations**

1. **org-assets → companies:**
   - Move 2 logo files
   - Update any database references (if any)

2. **documents → deals:**
   - Move 1 deal PDF
   - Update `document_files.storage_bucket` if it references old bucket

### **Step 3: Code Updates**

1. Change `broker-assets` → `companies` in:
   - `/api/org/company-branding/route.ts`

2. Verify `deals` bucket usage (already correct)

3. Update any other legacy references

### **Step 4: Cleanup**

1. Delete empty `documents` bucket (after migration)
2. Delete empty `org-assets` bucket (after migration)

---

## Questions Before Proceeding

### **1. How is the code currently working?**

If code says `broker-assets` but bucket is `org-assets`:
- Is there a bucket alias?
- Or is upload/download currently broken?
- Can you successfully upload a logo right now?

### **2. File Migration Strategy**

For the 3 existing files:
- Should I create a script to migrate them?
- Or can you manually move them in Supabase Dashboard?
- Or delete and re-upload fresh?

### **3. Database Table Updates**

After moving files, need to update:
```sql
-- If document_files table stores bucket name
UPDATE document_files 
SET storage_bucket = 'deals'
WHERE storage_bucket = 'documents';

-- Check for other tables referencing old bucket names
```

---

## Summary

**Good News:** ✅
- Your 3 desired buckets (`persons`, `companies`, `deals`) **already exist**!
- They're properly configured (private, 50MB limits, correct MIME types)
- Ready to use

**Migration Needed:** ⚠️
- Move 2 files from `org-assets` → `companies`
- Move 1 file from `documents` → `deals`
- Update 1 code reference: `broker-assets` → `companies`
- Deprecate 2 old buckets

**Estimated Effort:** ~30 minutes

---

I now understand the current state. **Ready to proceed with migration when you are!** 🚀

What would you like to do next?
