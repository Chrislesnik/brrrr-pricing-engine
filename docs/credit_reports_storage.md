## Credit Reports Storage

### Bucket
- Private bucket `credit-reports` (created by migration).
- Objects are expected at `credit-reports/{report_uuid}.pdf` (or similar).

### Tables
- `public.credit_reports`: `id` (uuid pk), `bucket`, `storage_path`, `assigned_to` (text[] clerk ids), `borrower_id` (uuid fk to `public.borrowers(id)` cascade delete), `status`, `metadata`, `created_at`.
- `public.credit_report_viewers`: maps `report_id` -> `user_id` (text, clerk id), plus `added_by`, timestamps, PK `(report_id, user_id)`.

### RLS summary
- Service role: full access to both tables and storage for this bucket.
- Reads: `owner_id` or any `user_id` listed in `credit_report_viewers` can see rows and read storage objects (via signed URLs).
- Writes: clients cannot insert storage objects or rows directly; must go through backend/Edge with service role.

### Upload flow (backend or Edge Function)
1) Authenticate the caller; ensure they can request/report.
2) Generate `reportId = crypto.randomUUID()`; set `storagePath = reportId + '.pdf'`.
3) Upload with service key:
   ```ts
   const supabase = createClient(url, serviceKey);
   await supabase.storage.from('credit-reports').upload(storagePath, fileBlob, {
     contentType: 'application/pdf',
     upsert: false,
   });
   ```
4) Insert metadata rows:
   ```sql
insert into public.credit_reports (id, bucket, storage_path, assigned_to, borrower_id, status, metadata)
values (:report_id, 'credit-reports', :storage_path, :assigned_to_array, :borrower_id, 'stored', :metadata_json);

   insert into public.credit_report_viewers (report_id, user_id, added_by)
select :report_id, unnest(:viewer_ids), :added_by;
   ```

### Access flow (client with user token)
```sql
-- Get report row if caller can view
select *
from public.credit_reports cr
where cr.id = :report_id
  and (
    auth.uid()::text = any (cr.owner_ids)
    or exists (
      select 1 from public.credit_report_viewers v
      where v.report_id = cr.id and v.user_id = auth.uid()::text
    )
  );
```
```ts
// If above query succeeds, issue signed URL with service key:
const { data } = await supabase.storage
  .from('credit-reports')
  .createSignedUrl(storagePath, 60 * 10); // 10 minutes
```

### Notes
- Keep service key server-side only.
- Add retention/audit if needed later. 
