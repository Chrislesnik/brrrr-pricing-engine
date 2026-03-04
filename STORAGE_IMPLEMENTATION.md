# Supabase Storage Implementation - Complete Documentation

**Date:** 2026-02-06
**Status:** ⚠️ **Partially Implemented with Stub Logic**

---

## Executive Summary

The Supabase storage system has a solid infrastructure foundation with buckets, policies, and database tables in place. However, the actual **access control enforcement is currently stubbed out**, meaning permissions aren't fully enforced yet. The system is production-ready for basic file operations but needs the enforcement logic implemented for role-based document access control.

---

## Current Implementation Status

### ✅ **Database Infrastructure** - COMPLETE

#### **Storage Buckets:**

1. **`documents`** - Main document storage
   - Private bucket (not publicly accessible)
   - 50 MB file size limit
   - MIME types: PDF, images, text, zip
   - Used for: Deal documents, loan files, legal docs

2. **`broker-assets`** - Company branding
   - Public bucket
   - Used for: Company logos, broker branding
   - Currently functional with upload/download

3. **`credit-reports`** - Credit report storage
   - Private bucket
   - Currently functional
   - Signed URL generation working

4. **`program-docs`** - Program documentation
   - Used for: Loan program PDF attachments
   - Connected to Programs feature

---

### ✅ **Database Tables** - COMPLETE

#### **`document_files`**

Stores metadata about uploaded documents:

```sql
CREATE TABLE public.document_files (
  id uuid PRIMARY KEY,
  storage_bucket text NOT NULL,           -- Which bucket: 'documents', 'credit-reports', etc.
  storage_path text NOT NULL,             -- File path in bucket
  title text,                             -- Display name
  description text,                       -- Optional description
  mime_type text,                         -- File type
  file_size bigint,                       -- Size in bytes
  uploaded_by text,                       -- Clerk user ID
  uploaded_at timestamptz DEFAULT now(),
  document_category_id bigint REFERENCES document_categories(id),
  status text DEFAULT 'active',          -- active, archived, deleted
  metadata jsonb                          -- Custom metadata
);
```

**Current Limitation:**
- ⚠️ No `deal_id` column yet (not linked to specific deals)
- ⚠️ No organization linkage

#### **`document_categories`**

20 pre-seeded categories for organizing documents:

| Category | Code | Internal Only | Storage Folder |
|----------|------|---------------|----------------|
| Application | application | No | application |
| Appraisal | appraisal | No | appraisal |
| Assets | assets | No | assets |
| Credit & Background | credit_and_background | Yes | credit-and-background |
| Construction | construction | No | construction |
| ID | id | Yes | id |
| Pricing | pricing | Yes | pricing |
| Internal Notes | internal_notes | Yes | internal-notes |
| ...and 12 more | | | |

**Features:**
- `is_internal_only` flag restricts visibility
- `storage_folder` organizes files in buckets
- Connected to RBAC permissions matrix

---

### ✅ **Storage Policies** - INFRASTRUCTURE COMPLETE

**Migration:** `20260128170500_storage_policies.sql`

#### **5 Policies on `storage.objects` for `documents` bucket:**

1. **Admin Full Access**
```sql
FOR ALL USING (bucket_id = 'documents' AND is_internal_admin())
```

2. **Select (Download)**
```sql
FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM document_files df
    WHERE df.storage_bucket = 'documents'
      AND df.storage_path = objects.name
      AND can_access_deal_document(df.id, df.document_category_id, 'view')
  )
)
```

3. **Insert (Upload)**
```sql
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  can_access_deal_document(..., 'upload')
)
```

4. **Update** - Similar to insert
5. **Delete** - Similar with 'delete' action

**Problem:**
All policies call `can_access_deal_document()`, which currently has **stub logic**!

---

### ⚠️ **Access Control Functions** - STUB IMPLEMENTATION

#### **`can_access_deal_document()` - NEEDS FULL IMPLEMENTATION**

**Current State (Stub):**
```sql
CREATE OR REPLACE FUNCTION public.can_access_deal_document(
  p_deal_id uuid,
  p_document_category_id bigint,
  p_action text
)
RETURNS boolean
AS $$
  SELECT
    CASE
      WHEN p_action NOT IN ('view','insert','upload','delete') THEN false
      ELSE (
        public.is_internal_admin()
        OR public.get_active_org_id() IS NOT NULL  -- ⚠️ STUB: Always true for org members!
      )
    END;
$$;
```

**What It Should Do:**
1. Check if user has a `deal_role` on the specific deal
2. Look up permissions from `document_access_permissions` table (org-specific) or `document_access_permissions_global` (template)
3. Match the user's deal role + document category + action
4. Return true/false based on stored permissions

**Migration Notes Say:**
> "Policies use can_access_deal_document() which needs business logic implementation"
> "NOTE: Policies currently use df.id as deal_id - adjust this based on your schema"

---

### ✅ **Application Layer** - BASIC FUNCTIONALITY

#### **Working Examples:**

**1. Company Logo Upload** (`/api/org/company-branding/route.ts`):
```typescript
const { data: upload } = await supabaseAdmin.storage
  .from("broker-assets")
  .upload(path, bytes, { contentType: file.type, upsert: true });

const { data: pub } = supabaseAdmin.storage
  .from("broker-assets")
  .getPublicUrl(upload.path);
```
- ✅ Upload works
- ✅ Public URL generation works
- ✅ Cleanup of old files works

**2. Credit Reports** (`/api/credit-reports/route.ts`):
```typescript
const { data: signed } = await supabaseAdmin.storage
  .from(bucket)
  .createSignedUrl(path, 60 * 5); // 5 minute expiry
```
- ✅ Signed URLs for secure access
- ✅ Organization-scoped queries
- ✅ User assignment filtering

**3. Program Documents** (`/settings/programs-actions.ts`):
```typescript
await supabaseAdmin.storage
  .from("program-docs")
  .upload(storagePath, arrayBuffer, { upsert: false });
```
- ✅ PDF upload for loan programs
- ✅ Document metadata tracked
- ✅ Webhook notifications on upload

---

## Architecture Overview

### **Storage Flow:**

```
1. User uploads file via UI
   ↓
2. API route validates user/org
   ↓
3. Upload to Supabase Storage bucket
   ↓
4. Create record in document_files table
   ↓
5. RLS policies check can_access_deal_document()
   ↓
6. Return success/error
```

### **Access Control Chain:**

```
Storage Policy (storage.objects)
  ↓ calls
can_access_deal_document(deal_id, category_id, action)
  ↓ should check (but doesn't yet)
document_access_permissions (from RBAC matrix)
  ↓ matches
deal_roles (user's role on deal) + document_category + action
  ↓ returns
true/false (grant/deny access)
```

---

## What's Currently Working

### ✅ **Broker Assets (Logos):**

**Location:** `/org/[orgId]/settings` → General tab

**Functionality:**
- Upload company logo
- Update/replace logo
- Delete logo
- Automatic cleanup of old files
- White labeling control

**Storage:**
- Bucket: `broker-assets` (public)
- Path: `company-logos/{orgId}/{memberId}/{timestamp}-{filename}`
- Access: Public URLs

---

### ✅ **Credit Reports:**

**Location:** Accessed via API (`/api/credit-reports`)

**Functionality:**
- Upload credit report PDFs
- Assign to specific users
- Generate signed URLs (5 min expiry)
- Organization-scoped access
- Metadata tracking

**Storage:**
- Bucket: `credit-reports` (private)
- Access: Signed URLs only
- Filtering: By borrower, assigned users

---

### ✅ **Program Documents:**

**Location:** `/org/[orgId]/settings?tab=programs`

**Functionality:**
- Attach PDFs to loan programs
- Multiple documents per program
- Preview thumbnails
- Delete documents
- Webhook notifications

**Storage:**
- Bucket: `program-docs` (private)
- Path: `programs/{programId}/{documentId}/{filename}`
- Cleanup: Cascades when program deleted

---

## What's NOT Working / Missing

### ⚠️ **1. Deal Document Management**

**Problem:** No UI or API for uploading documents to deals

**Missing:**
- Upload interface in deals page
- Document list/viewer for deals
- Download buttons
- Document organization by category

**Needed:**
- React component for file upload
- API endpoint `/api/deals/[id]/documents`
- Integration with `document_files` table
- Link to `deal_id` (requires schema update)

---

### ⚠️ **2. Permission Enforcement**

**Problem:** `can_access_deal_document()` doesn't check RBAC permissions

**Current Behavior:**
- Internal admins: ✅ Full access (correct)
- Org members: ✅ Full access (WRONG - should check role permissions!)
- Non-members: ❌ No access (correct)

**Needed Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.can_access_deal_document(
  p_deal_id uuid,
  p_document_category_id bigint,
  p_action text
)
RETURNS boolean
AS $$
BEGIN
  -- 1. Internal admin bypass
  IF public.is_internal_admin() THEN
    RETURN true;
  END IF;

  -- 2. Check if user has a deal role on this deal
  IF NOT EXISTS (
    SELECT 1 FROM deal_roles dr
    WHERE dr.deal_id = p_deal_id
      AND dr.users_id = public.get_current_user_id()
  ) THEN
    RETURN false;
  END IF;

  -- 3. Get user's deal role
  DECLARE
    v_deal_role_type_id bigint;
  BEGIN
    SELECT dr.deal_role_types_id INTO v_deal_role_type_id
    FROM deal_roles dr
    WHERE dr.deal_id = p_deal_id
      AND dr.users_id = public.get_current_user_id()
    LIMIT 1;

    -- 4. Check permissions from RBAC matrix
    RETURN EXISTS (
      SELECT 1
      FROM document_access_permissions dap
      WHERE dap.clerk_org_id = public.get_active_org_id()
        AND dap.deal_role_types_id = v_deal_role_type_id
        AND dap.document_categories_id = p_document_category_id
        AND (
          (p_action = 'view' AND dap.can_view) OR
          (p_action = 'insert' AND dap.can_insert) OR
          (p_action = 'upload' AND dap.can_upload) OR
          (p_action = 'delete' AND dap.can_delete)
        )
    );
  END;
END;
$$;
```

---

### ⚠️ **3. Deal-Document Relationships**

**Problem:** `document_files` table doesn't link to deals

**Needed Schema Update:**
```sql
ALTER TABLE public.document_files
  ADD COLUMN deal_id uuid REFERENCES deals(id) ON DELETE CASCADE;

CREATE INDEX idx_document_files_deal_id 
  ON public.document_files(deal_id);
```

**Then update policies to use:**
```sql
WHERE df.deal_id = p_deal_id  -- Instead of df.id
```

---

### ⚠️ **4. Document Categories Integration**

**Problem:** Categories exist but aren't used in UI

**Needed:**
- Dropdown to select category when uploading
- Filter documents by category
- Category-based folders in storage
- Category permissions enforcement

---

## Storage Buckets - Complete List

| Bucket Name | Public? | Purpose | Status |
|-------------|---------|---------|--------|
| `documents` | No | Deal documents | ⚠️ Policies exist, no UI |
| `broker-assets` | Yes | Company logos | ✅ Working |
| `credit-reports` | No | Credit reports | ✅ Working |
| `program-docs` | No | Program PDFs | ✅ Working |

---

## File Upload Patterns

### **Pattern 1: Direct Upload (Broker Assets)**

```typescript
// 1. Get file from form
const file = form.get("logo") as File;
const arrayBuffer = await file.arrayBuffer();
const bytes = new Uint8Array(arrayBuffer);

// 2. Upload to storage
const path = `company-logos/${orgUuid}/${memberId}/${Date.now()}-${file.name}`;
const { data: upload } = await supabaseAdmin.storage
  .from("broker-assets")
  .upload(path, bytes, { contentType: file.type, upsert: true });

// 3. Get public URL
const { data: pub } = supabaseAdmin.storage
  .from("broker-assets")
  .getPublicUrl(upload.path);

// 4. Save URL to database
await supabaseAdmin
  .from("brokers")
  .update({ company_logo_url: pub.publicUrl });
```

**Use for:** Public assets, branding, avatars

---

### **Pattern 2: Signed URLs (Credit Reports)**

```typescript
// 1. Upload to private bucket
await supabaseAdmin.storage
  .from("credit-reports")
  .upload(storagePath, fileData);

// 2. Create metadata record
await supabaseAdmin
  .from("credit_reports")
  .insert({
    bucket: "credit-reports",
    storage_path: storagePath,
    borrower_id,
    organization_id: orgUuid,
    assigned_to: [userId],
  });

// 3. Generate signed URL (temporary access)
const { data: signed } = await supabaseAdmin.storage
  .from("credit-reports")
  .createSignedUrl(storagePath, 60 * 5); // 5 minutes

// 4. Return to client
return { url: signed.signedUrl };
```

**Use for:** Private documents, temporary access, expiring links

---

### **Pattern 3: Tracked Documents (Programs)**

```typescript
// 1. Generate unique document ID
const documentId = crypto.randomUUID();

// 2. Upload file
const storagePath = `programs/${programId}/${documentId}/${fileName}`;
await supabaseAdmin.storage
  .from("program-docs")
  .upload(storagePath, arrayBuffer);

// 3. Create tracking record
await supabaseAdmin
  .from("program_documents")
  .insert({
    id: documentId,
    program_id: programId,
    storage_path: storagePath,
    title: fileName,
    mime_type: file.type,
    status: "pending",
  });

// 4. Trigger webhook for processing
await fetch(webhookUrl, {
  method: "POST",
  body: JSON.stringify({ program_document_id: documentId }),
});
```

**Use for:** Documents needing processing, webhooks, metadata

---

## RLS Policy Examples

### **Current Policy (Documents Bucket):**

```sql
-- Allow users to view documents they have access to
CREATE POLICY "documents_select_via_document_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'documents') AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents') 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- ⚠️ Using document file ID, not deal ID!
          df.document_category_id, 
          'view'
        )
    )
  )
);
```

**Issues:**
1. Uses `df.id` instead of `df.deal_id` (doesn't exist yet)
2. `can_access_deal_document()` is stubbed out
3. No actual permission checking happens

---

## Integration with RBAC System

### **How It Should Work:**

The RBAC Permissions Matrix you configured stores permissions in `document_access_permissions`:

```sql
-- Example permission record:
clerk_org_id: '5a5ebcd4-7327-42bf-9d0e-b3b6c735a075'
deal_role_types_id: 4  -- Broker
document_categories_id: 1  -- Application
can_view: true
can_insert: false
can_upload: false
can_delete: false
```

**Enforcement Flow (Not Yet Implemented):**

1. User tries to download document from deal
2. Storage policy checks `can_access_deal_document(deal_id, category_id, 'view')`
3. Function looks up user's role on that deal
4. Queries `document_access_permissions` for (org, role, category, action)
5. Returns true/false based on RBAC matrix configuration

**Currently:**
- Steps 1-2: ✅ Working
- Steps 3-5: ⚠️ Stubbed out (always returns true for org members)

---

## Migration Files

### **Storage-Related Migrations:**

1. **`20260128170200_document_categories.sql`**
   - Creates `document_categories` table
   - Defines 20 standard categories

2. **`20260128170300_document_files.sql`**
   - Creates `document_files` table
   - Basic RLS policies

3. **`20260128170400_helper_functions.sql`**
   - Creates `can_access_deal_document()` (stub version)
   - Creates `is_internal_admin()`

4. **`20260128170500_storage_policies.sql`**
   - Creates 5 storage policies on `documents` bucket
   - Links to `can_access_deal_document()`

5. **`20260202132703_seed_document_categories_data.sql`**
   - Seeds 20 document categories

---

## API Endpoints Using Storage

### **Implemented:**

| Endpoint | Method | Bucket | Purpose | Status |
|----------|--------|--------|---------|--------|
| `/api/org/company-branding` | POST | broker-assets | Upload logo | ✅ Working |
| `/api/org/company-branding` | DELETE | broker-assets | Delete logo | ✅ Working |
| `/api/credit-reports` | GET | credit-reports | Get signed URLs | ✅ Working |
| `/settings/programs-actions` | POST | program-docs | Upload program PDFs | ✅ Working |

### **Missing:**

| Endpoint | Method | Bucket | Purpose | Status |
|----------|--------|--------|---------|--------|
| `/api/deals/[id]/documents` | GET | documents | List documents | ❌ Not implemented |
| `/api/deals/[id]/documents` | POST | documents | Upload document | ❌ Not implemented |
| `/api/deals/[id]/documents/[docId]` | GET | documents | Download document | ❌ Not implemented |
| `/api/deals/[id]/documents/[docId]` | DELETE | documents | Delete document | ❌ Not implemented |

---

## Implementation Roadmap

### **Phase 1: Schema Updates** (Required First)

```sql
-- Add deal_id to document_files
ALTER TABLE public.document_files
  ADD COLUMN deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Update storage policies to use df.deal_id instead of df.id
-- (Requires re-running storage policies migration)
```

### **Phase 2: Implement can_access_deal_document()**

Full business logic as outlined above:
1. Check deal role exists
2. Query RBAC permissions
3. Match role + category + action
4. Return proper true/false

### **Phase 3: Build UI Components**

1. **Document Upload Component**
   - File dropzone
   - Category selector
   - Progress indicator
   - Preview/thumbnails

2. **Document List Component**
   - Filter by category
   - Sort by date/name
   - Download buttons
   - Delete with confirmation

3. **Document Viewer**
   - PDF preview
   - Metadata display
   - Version history (future)

### **Phase 4: API Endpoints**

Create full CRUD endpoints for deal documents:
- GET list with filtering
- POST upload with validation
- GET download with signed URLs
- DELETE with permission check

---

## Security Considerations

### **Current Security:**

✅ **Good:**
- Private buckets (documents, credit-reports)
- RLS policies enabled
- Service role used in API routes
- Organization-scoped queries

⚠️ **Needs Improvement:**
- Stub permission checks (too permissive)
- No deal-level isolation yet
- No audit logging
- No file size validation in policies

### **Best Practices for Implementation:**

1. **Always use service role** in API routes (not user-scoped client)
2. **Validate file types** before upload
3. **Check file size limits** (prevent abuse)
4. **Generate unique paths** to prevent collisions
5. **Clean up orphaned files** when records deleted
6. **Use signed URLs** for private documents (not public URLs)
7. **Set expiry times** on signed URLs (5-60 minutes typical)
8. **Log all upload/delete** operations for audit trail

---

## Storage Limits & Configuration

### **Current Bucket Configuration:**

**Documents Bucket:**
- Max file size: 50 MB
- Allowed MIME types: `application/pdf, image/*, text/*, application/zip`
- Public: No
- File size limit enforcement: ⚠️ Not in RLS policies yet

**Recommendations:**
- Add file size check in storage policies
- Add MIME type validation
- Consider separate buckets for different document types
- Implement storage quota per organization

---

## Testing Storage

### **Test Upload (Broker Assets):**

```bash
# Via UI:
1. Go to /org/[orgId]/settings
2. Upload company logo
3. Check broker-assets bucket in Supabase
4. Verify public URL works

# Via API:
curl -X POST http://localhost:3000/api/org/company-branding \
  -H "Content-Type: multipart/form-data" \
  -F "logo=@logo.png"
```

### **Test Signed URLs (Credit Reports):**

```sql
-- In Supabase SQL:
SELECT 
  cr.id,
  cr.storage_path,
  cr.bucket
FROM credit_reports cr
WHERE organization_id = 'your-org-uuid';

-- Then in app, generate signed URL for that path
```

---

## Future Enhancements

### **v2 Features:**

1. **Versioning**
   - Track document versions
   - Rollback capability
   - Version comparison

2. **Sharing**
   - Share documents with external users
   - Time-limited share links
   - Password-protected shares

3. **Collaboration**
   - Comments on documents
   - Annotations
   - Approval workflows

4. **Search**
   - Full-text search in PDFs
   - Metadata search
   - Tag-based filtering

5. **Storage Analytics**
   - Usage by organization
   - Storage quotas
   - Cost tracking

---

## Quick Reference

### **Check Storage Usage:**

```sql
-- Total files per bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_mb
FROM storage.objects
GROUP BY bucket_id;
```

### **List Recent Uploads:**

```sql
SELECT 
  name,
  bucket_id,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects
ORDER BY created_at DESC
LIMIT 20;
```

### **Find Orphaned Files:**

```sql
-- Files in storage.objects but not in document_files
SELECT o.name, o.bucket_id
FROM storage.objects o
WHERE o.bucket_id = 'documents'
  AND NOT EXISTS (
    SELECT 1 FROM document_files df
    WHERE df.storage_path = o.name
  );
```

---

## Summary

**Current Status:**
- ✅ Infrastructure: Complete and solid
- ✅ Basic operations: Working (logos, credit reports, program docs)
- ⚠️ Permission enforcement: Stubbed out
- ❌ Deal documents: Not implemented
- ❌ UI components: Missing for main use case

**Next Steps:**
1. Add `deal_id` column to `document_files`
2. Implement full `can_access_deal_document()` logic
3. Build document upload/list UI for deals
4. Create `/api/deals/[id]/documents` endpoints
5. Test permission enforcement end-to-end

**Estimated Effort:**
- Schema updates: 1 hour
- Function implementation: 2-3 hours
- UI components: 4-6 hours
- API endpoints: 2-3 hours
- Testing: 2-3 hours
- **Total: ~12-16 hours**

The foundation is excellent - just needs the enforcement logic and UI to be production-ready! 🚀
