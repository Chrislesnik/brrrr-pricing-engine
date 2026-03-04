# Storage Buckets - Reference Guide

## Buckets Referenced in Codebase

### 1. **`deals`** - Deal Documents
**Status:** ⚠️ May need to be created  
**Public:** No (private)  
**Used in:**
- `/api/deals/[id]/documents/route.ts` - Upload/list deal documents
- `/api/deals/[id]/documents/[docId]/route.ts` - Download/delete
- `/api/deals/[id]/documents/[docId]/url/route.ts` - Signed URLs

**Path Structure:**
```
deals/{dealId}/{documentId}/{filename}
```

**Configuration Needed:**
```sql
-- If bucket doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deals',
  'deals',
  false,  -- Private
  52428800,  -- 50 MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'application/zip', 'text/plain']
);
```

---

### 2. **`broker-assets`** - Company Logos  
**Status:** ✅ Working  
**Public:** Yes  
**Used in:**
- `/api/org/company-branding/route.ts` - Upload/delete company logos

**Path Structure:**
```
company-logos/{orgId}/{memberId}/{timestamp}-{filename}
```

**Features:**
- Public URLs (no signed URLs needed)
- Automatic cleanup of old files
- White labeling support

---

### 3. **`credit-reports`** - Credit Reports
**Status:** ✅ Working  
**Public:** No (private)  
**Used in:**
- `/api/credit/run/route.ts` - Upload credit report PDFs
- `/api/credit-reports/route.ts` - Generate signed URLs

**Path Structure:**
```
credit-reports/{borrowerId}/{timestamp}-{filename}
```

**Features:**
- Signed URLs (5-60 minute expiry)
- User assignment tracking
- Org-scoped access

---

### 4. **`program-docs`** - Program Documentation
**Status:** ✅ Working  
**Public:** No (private)  
**Used in:**
- `/settings/programs-actions.ts` - Upload program PDFs
- `/api/programs/[id]/documents/url/route.ts` - Signed URLs

**Path Structure:**
```
programs/{programId}/{documentId}/{filename}
```

**Features:**
- PDF attachments for loan programs
- Webhook notifications on upload
- Cascade delete with program

---

### 5. **`documents`** (Legacy/Planned?)
**Status:** ⚠️ Has policies but minimal usage  
**Public:** No (private)  
**Used in:**
- Storage policies exist (migration 20260128170500)
- Not actively used in current code
- May be replaced by `deals` bucket

**Note:** The original plan had a `documents` bucket, but the code now uses the `deals` bucket instead.

---

## Bucket Comparison

| Bucket | Public | Size Limit | Active Use | RLS Policies |
|--------|--------|------------|------------|--------------|
| `deals` | No | 50 MB | ✅ Yes | ⚠️ Needs creation |
| `broker-assets` | Yes | - | ✅ Yes | ✅ Working |
| `credit-reports` | No | - | ✅ Yes | ✅ Working |
| `program-docs` | No | - | ✅ Yes | ✅ Working |
| `documents` | No | 50 MB | ❌ No | ✅ Exists (unused) |

---

## Required Actions

### If `deals` bucket doesn't exist:

**Run this SQL in Supabase Dashboard:**

```sql
-- Create deals bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deals',
  'deals',
  false,
  52428800,  -- 50 MB in bytes
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);

-- Add RLS policies for deals bucket
CREATE POLICY "deals_admin_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'deals' AND (auth.jwt() ->> 'sub') IN (
  SELECT clerk_user_id FROM users WHERE is_internal_yn = true
));

CREATE POLICY "deals_org_members_access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'deals' AND
  EXISTS (
    SELECT 1 FROM document_files df
    WHERE df.storage_bucket = 'deals'
      AND df.storage_path = objects.name
      AND df.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = (auth.jwt() ->> 'sub')
      )
  )
);
```

---

## Verify Buckets Exist

**Run `CHECK_STORAGE_BUCKETS.sql` in Supabase Dashboard**

Expected output should show:
- ✅ broker-assets
- ✅ credit-reports
- ✅ program-docs
- ✅ deals (or documents)

If any are missing, use the SQL above to create them.

---

## Migration History

**Storage-related migrations:**
- `20260128170500_storage_policies.sql` - Created policies for `documents` bucket
- Note: No migration for `deals`, `broker-assets`, `credit-reports`, or `program-docs` buckets
- These may have been created manually in Supabase Dashboard

---

## Recommendation

**Standardize on `deals` bucket** instead of `documents`:
1. ✅ Code already uses `deals` bucket
2. ✅ More specific naming
3. ✅ Aligns with table name
4. Consider deprecating `documents` bucket if unused

Or keep both if you want separation between general documents and deal-specific files.
