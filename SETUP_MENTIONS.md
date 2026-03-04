# Setup Guide: @Mentions Feature

## Quick Start

Follow these steps to enable the @mentions feature in Deal comments:

### 1. Run Database Migration

The migration file has been created and needs to be applied to your database:

**Location:** `supabase/migrations/20260205000000_add_comment_mentions_and_notifications.sql`

**Option A: Using Supabase CLI (Recommended)**
```bash
# From project root
npx supabase db push

# Or if you're using local development
npx supabase migration up
```

**Option B: Using psql directly**
```bash
psql -h your-host -d your-database -U your-user -f supabase/migrations/20260205000000_add_comment_mentions_and_notifications.sql
```

**Option C: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Run the query

### 2. Verify Migration

Run this query to verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('deal_comment_mentions', 'notifications');
```

You should see both tables listed.

### 3. Test the Feature

1. Start the development server:
   ```bash
   pnpm dev:pricing
   ```

2. Navigate to any deal in the pipeline
3. Click the comments button (sheet will open on the right)
4. Type `@` in the comment box
5. You should see a dropdown list of users
6. Select a user and submit the comment
7. The mentioned user will receive a notification

### 4. Verify User API Works

Test the users endpoint:
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should receive a JSON response with user data.

## What Was Added

### New Files

1. **`mention-textarea.tsx`** - Smart textarea component with @mention autocomplete
2. **`/api/users/route.ts`** - API endpoint to fetch users for mentions
3. **Migration file** - Database schema for mentions and notifications
4. **Documentation** - This guide and MENTIONS_FEATURE.md

### Updated Files

1. **`deals-data-table.tsx`** - Updated to use mention-aware components
2. **`/api/deals/[id]/comments/route.ts`** - Enhanced to handle mentions and create notifications

### Database Tables

1. **`deal_comment_mentions`** - Tracks which users were mentioned in each comment
2. **`notifications`** - General notification system for users

## Features

✅ **@Mention Autocomplete** - Type @ to see user list  
✅ **Search & Filter** - Filter users by name or email  
✅ **Keyboard Navigation** - Arrow keys, Enter, Tab, Escape  
✅ **Highlighted Mentions** - Mentions show with blue background  
✅ **Notifications** - Users get notified when mentioned  
✅ **Smart Detection** - Extracts mentions from text automatically  

## Architecture

```
User types @ in comment
    ↓
MentionTextarea shows dropdown
    ↓
User selects someone
    ↓
Comment submitted with mentions array
    ↓
API creates comment + mention records
    ↓
Notifications created for mentioned users
    ↓
Users see highlighted mentions in comments
```

## Troubleshooting

### No users appear in dropdown
- Check `/api/users` endpoint returns data
- Verify you're logged in
- Check database has active users

### Mentions not highlighting
- Check CommentWithMentions component is rendering
- Verify comment content includes @Username format

### Notifications not created
- Check `notifications` table exists
- Verify RLS policies are applied
- Check API logs for errors

### Migration fails
- Ensure no conflicting table names
- Check Supabase connection
- Verify you have admin privileges

## Next Steps

See `apps/pricing-engine/MENTIONS_FEATURE.md` for:
- Detailed API documentation
- Component usage examples
- Notification system details
- Future enhancement ideas

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review API logs
3. Verify database tables exist
4. Check RLS policies are configured
5. Ensure user has proper permissions

## Rollback (if needed)

To remove the feature:

```sql
BEGIN;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.deal_comment_mentions CASCADE;
COMMIT;
```

Then revert the code changes.
