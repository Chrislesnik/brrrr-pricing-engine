# Documents Bucket - Current Implementation Analysis

**Date:** 2026-02-10
**Database:** brrrr-pricing-engine-dev
**Bucket:** `documents`

---

## Current Setup

### Bucket Configuration

**Name:** `documents`  
**Public:** No (private)  
**File Size Limit:** 50 MB (52,428,800 bytes)  
**Allowed MIME Types:** 
- `application/pdf`
- `image/*`
- `text/*`
- `application/zip`

**Created:** 2026-01-29

---

### Current Files in Bucket

**Total:** 1 file (240 KB)

**File:**
```
Path: deals/d50d84b5-49a3-4bd6-b6f8-30ff78ba304d/2LnZcOWkucjQ_PH6wfoeG.pdf
Type: application/pdf
Size: 240 KB
Uploaded: 2026-02-06
```

**Path Structure:**
```
documents/
  └─ deals/
      └─ {dealId}/
          └─ {documentId}.pdf
```

---

## Database Schema

### `document_files` Table

Stores metadata about all uploaded documents:

**Key Columns:**
- `id` (bigint) - Primary key
- `uuid` (uuid) - Alternative unique identifier
- `document_name` (text) - Display name
- `file_type` (text) - MIME type
- `file_size` (bigint) - Size in bytes
- `storage_bucket` (text) - Which bucket: "documents", "deals", etc.
- `storage_path` (text) - Path within bucket
- `uploaded_by` (text) - Clerk user ID
- `uploaded_at` (timestamptz) - Upload timestamp
- `document_category_id` (bigint) - FK to document_categories
- `document_status` (enum) - Status of document
- `tags` (text[]) - Array of tags
- Other metadata: notes, dates, etc.

**Unique Constraint:**
```sql
UNIQUE (storage_bucket, storage_path)
```
Prevents duplicate files at same location.

---

### `deal_document_participants` Table

Links documents to deals (many-to-many relationship):

**Columns:**
- `deal_id` (uuid) - FK to deals(id)
- `document_file_id` (bigint) - FK to document_files(id)
- `source_table` (text) - Where doc came from
- `source_pk` (bigint) - Original source record ID
- `created_at` (timestamptz)

**Purpose:**
- A document can be linked to multiple deals
- A deal can have multiple documents
- Tracks the original source of the document

**Example:**
```
Deal A (uuid-123) → Document 1 (from borrower)
Deal A (uuid-123) → Document 2 (from guarantor)
Deal B (uuid-456) → Document 1 (same doc, shared)
```

---

## Storage RLS Policies

### 5 Policies on `storage.objects` for `documents` bucket:

**1. Admin Full Access**
```sql
FOR ALL 
USING (bucket_id = 'documents' AND is_internal_admin())
```
Internal admins can do anything.

**2. SELECT (View/Download)**
```sql
FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM document_files df
    WHERE df.storage_bucket = 'documents'
      AND df.storage_path = objects.name
      AND can_access_deal_document(df.id, df.document_category_id, 'view')
  )
)
```

**3. INSERT (Upload)**
```sql
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  can_access_deal_document(..., 'upload')
)
```

**4. UPDATE** - Similar to INSERT

**5. DELETE** - Similar with 'delete' action

**Problem:**
All policies call `can_access_deal_document()` which is currently stubbed!

---

## API Implementation

### File: `/api/deals/[id]/documents/route.ts`

**GET Endpoint:**
- Fetches all documents for a deal
- Queries `deal_document_participants` to get document IDs
- Joins with `document_files` to get metadata
- Joins with `document_categories` for category names
- Returns transformed list with uploader info

**POST Endpoint (Upload):**

```typescript
// 1. Generate unique filename
const uniqueId = nanoid();
const storagePath = `${dealId}/${fileName}`;

// 2. Upload to "deals" bucket ⚠️
await supabaseAdmin.storage
  .from("deals")  // ← Code says "deals"
  .upload(storagePath, fileBuffer);

// 3. Create document_files record
await supabaseAdmin
  .from("document_files")
  .insert({
    storage_bucket: "deals",  // ← Code says "deals"
    storage_path: storagePath,
    document_category_id,
    ...
  });

// 4. Link to deal
await supabaseAdmin
  .from("deal_document_participants")
  .insert({
    deal_id,
    document_file_id: docFile.id,
  });
```

---

## Code vs Database Mismatch

### Issue: Bucket Name Inconsistency

**Code uses:**
```typescript
.from("deals")  // In API route
```

**Database reality:**
- Bucket: `documents` (not "deals")
- Path: `deals/d50d84b5-.../file.pdf`
- So files go in: `documents` bucket, `deals/` subfolder

**But also:**
- A separate `deals` bucket exists (empty)
- RLS policies are for `documents` bucket
- Code thinks it's uploading to `deals` bucket

**Questions:**
1. How is this currently working if code says "deals" but policies are for "documents"?
2. Is there a bucket redirect/alias?
3. Or are uploads currently failing?

---

## Current Folder Structure

### In `documents` bucket:

```
documents/
  └─ deals/
      └─ {dealId}/
          └─ {uniqueId}.{ext}
```

**Example:**
```
documents/deals/d50d84b5-49a3-4bd6-b6f8-30ff78ba304d/2LnZcOWkucjQ_PH6wfoeG.pdf
```

**No subfolders for:**
- Organizations
- Entities  
- Persons
- Document categories

---

## Access Control Flow

```
User uploads file
  ↓
API validates user/deal access
  ↓
Upload to storage bucket
  ↓
Create document_files record
  ↓
Create deal_document_participants link
  ↓
RLS policy checks:
  - Is user internal admin? → Allow
  - Else: can_access_deal_document()?
    - Currently: Returns true for all org members (STUB!)
    - Should: Check RBAC permissions matrix
```

---

## Linking System

### How Documents Connect to Deals:

**Method:** Junction table (`deal_document_participants`)

**Why not direct FK?**
- Documents can be shared across deals
- Documents can belong to borrowers/guarantors/properties
- Then automatically linked to deals via triggers

**Example Triggers:**
- When guarantor added to deal → their docs auto-link
- When property added to deal → property docs auto-link
- Keeps document relationships flexible

---

## What Works

Based on your query results showing 1 file exists:

- Upload to `documents` bucket works (somehow!)
- File storage working
- Path structure: `deals/{dealId}/{docId}`
- Metadata tracked in `document_files`
- Link to deal via `deal_document_participants`

---

## What's Unclear

1. **Bucket Name Mismatch:**
   - Code: `.from("deals")`
   - Policies: `bucket_id = 'documents'`
   - Actual file: In `documents` bucket
   - How is this working?

2. **Empty Buckets:**
   - `deals` bucket exists but is empty
   - Why not use it if code references it?

3. **Access Control:**
   - Policies reference `can_access_deal_document()`
   - Function is stubbed out
   - Is access control actually enforced?

---

## Summary

**Current State of `documents` Bucket:**
- ✅ Exists and configured (50MB, private, PDF/images/text/zip)
- ✅ Has 5 RLS policies created
- ✅ Stores files with path: `deals/{dealId}/{docId}`
- ✅ One test file exists
- ⚠️ RLS policies call stubbed function
- ⚠️ Code/bucket name mismatch needs clarification

**Tables:**
- ✅ `document_files` - Metadata storage
- ✅ `deal_document_participants` - Links docs to deals
- ✅ `document_categories` - 20 categories for organization

**Ready for Next Steps:**
Once we understand the bucket name mismatch, we can properly refactor to your desired structure.

---

## Questions to Resolve

1. Why does code use `deals` bucket but file is in `documents` bucket?
2. Should we consolidate on one bucket name?
3. Is the current upload/download functionality working in the app?

Please clarify these and I can create an accurate migration plan!
