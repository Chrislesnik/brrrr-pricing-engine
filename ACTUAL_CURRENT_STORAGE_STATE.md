# Actual Current Storage State - DEV Database

**Date:** 2026-02-10  
**Database:** brrrr-pricing-engine-dev  
**Verified:** ✅ From live database query

---

## Current Buckets (What Actually Exists)

### **1. `org-assets` Bucket**

**Files:** 2 files (58 KB total)

**Path Structure:**
```
whitelabel-logos/{orgId}/dark-{timestamp}-{filename}.png
whitelabel-logos/{orgId}/light-{timestamp}-{filename}.png
```

**Example:**
```
whitelabel-logos/082f8b26-cfc9-401a-9fea-2d764381b2cc/dark-1770510552527-brrrr-logo-white-2025-11-11.png
whitelabel-logos/082f8b26-cfc9-401a-9fea-2d764381b2cc/light-1770510552232-brrrr-logo-2025-11-11.png
```

**Purpose:** Organization whitelabel branding (dark/light theme logos)

**Code References:**
- ⚠️ Code uses `broker-assets` but actual bucket is `org-assets`!
- Used in: `/api/org/company-branding/route.ts`

---

### **2. `documents` Bucket**

**Files:** 1 file (240 KB)

**Path Structure:**
```
deals/{dealId}/{documentId}.pdf
```

**Example:**
```
deals/d50d84b5-49a3-4bd6-b6f8-30ff78ba304d/2LnZcOWkucjQ_PH6wfoeG.pdf
```

**Purpose:** Deal documents

**Code References:**
- ✅ Code uses `deals` bucket name but files are in `documents` bucket!
- Used in: `/api/deals/[id]/documents/route.ts`

---

## Discrepancy Analysis

### **Issue #1: Bucket Name Mismatch (org-assets vs broker-assets)**

**Code says:**
```typescript
.from("broker-assets")
```

**Database has:**
```
bucket: org-assets
```

**Impact:** ⚠️ Code may be broken unless there's a redirect/alias

---

### **Issue #2: Bucket Name Mismatch (deals vs documents)**

**Code says:**
```typescript
.from("deals")
```

**Database has:**
```
bucket: documents
path: deals/{dealId}/...
```

**Impact:** ⚠️ Code may be broken unless there's a redirect/alias

---

## What You Want (3-Bucket Structure)

| Desired Bucket | Current Equivalent | Migration Needed |
|----------------|-------------------|------------------|
| `persons` | - | ✅ Create new |
| `companies` | `org-assets` | ✅ Rename or migrate |
| `deals` | `documents` (with deals/ path) | ✅ Rename or migrate |

---

## Current Code vs Reality

### **Company Branding Code:**
```typescript
// Code:
await supabaseAdmin.storage.from("broker-assets")

// Reality in DB:
bucket_id = "org-assets"
```

**Questions:**
- Is there a bucket alias/redirect?
- Or is the code not working?
- When was `broker-assets` renamed to `org-assets`?

### **Deal Documents Code:**
```typescript
// Code:
await supabaseAdmin.storage.from("deals")

// Reality in DB:
bucket_id = "documents"
path = "deals/..."
```

**Questions:**
- Same question - alias or broken?
- Files are already in `deals/` subfolder structure

---

## Missing Buckets (Referenced in code but not seen in query)

- `credit-reports` - Not in query results (may have no files yet)
- `program-docs` - Not in query results (may have no files yet)

---

## Recommended Next Steps

### **Option A: Align Code with Current DB (Quick Fix)**

Change code to use actual bucket names:
- `broker-assets` → `org-assets` in code
- `deals` → `documents` in code

### **Option B: Align DB with Desired Structure (Clean Migration)**

1. Create 3 new buckets: `persons`, `companies`, `deals`
2. Migrate files:
   - `org-assets` whitelabel logos → `companies`
   - `documents` deal files → `deals`
3. Update all code references
4. Update storage policies
5. Delete old buckets after migration

---

## What I Need to Know

**Critical Questions:**

1. **Is the code currently working?**
   - Can you upload/download company logos?
   - Can you upload/download deal documents?
   - If yes, there must be bucket aliases or I'm missing something

2. **Do the buckets `broker-assets` and `deals` exist?**
   - The query only showed 2 buckets
   - But maybe there are more with no files yet?

3. **Full bucket list:**
   - Can you run just the first query:
   ```sql
   SELECT id, name, public FROM storage.buckets ORDER BY created_at;
   ```
   - This will show ALL buckets, even empty ones

---

## Action Plan (After Clarification)

Once I know the full list of buckets and whether code is working, I can:

1. ✅ Document the actual current state accurately
2. ✅ Create migration plan to 3-bucket structure
3. ✅ Update all code references
4. ✅ Migrate existing files
5. ✅ Update RLS policies

**Please share the complete list of buckets from the first query!** 🔍
