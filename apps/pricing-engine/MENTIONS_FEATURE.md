# User Mentions Feature

## Overview

The Deal comments system now supports @mentions, allowing users to tag team members in comments and trigger notifications.

## Features

### 1. **@Mention Autocomplete**
- Type `@` in any comment textarea to trigger the mention dropdown
- Search users by name or email
- Navigate with arrow keys (↑/↓)
- Select with Enter or Tab
- Cancel with Escape
- Click to select

### 2. **Highlighted Mentions**
- Mentioned usernames are highlighted in comments with a blue background
- Format: `@FirstName LastName`

### 3. **Notifications**
- Users receive notifications when mentioned in comments
- Notifications include:
  - Who mentioned them
  - Which deal the comment is on
  - Direct link to the deal

## Usage

### For Users

1. **Mention someone in a comment:**
   ```
   @John Smith can you review this deal?
   ```

2. **Multiple mentions:**
   ```
   @John Smith and @Jane Doe, please coordinate on this.
   ```

3. **Submit comment:**
   - Press `Enter` (without Shift) to submit
   - Or click the Send button

### For Developers

#### API Endpoints

**GET /api/users**
- Fetches all active users for mentions
- Returns: `{ users: [{ id, name, email, avatar_url }] }`

**POST /api/deals/:id/comments**
- Creates a comment with mentions
- Body: `{ content: string, mentions: string[] }`
- Automatically creates notifications for mentioned users

#### Database Schema

**Tables:**
- `deal_comment_mentions` - Tracks mention relationships
- `notifications` - Stores user notifications

See migration: `20260205000000_add_comment_mentions_and_notifications.sql`

## Setup

### 1. Run Database Migration

```bash
cd apps/pricing-engine
npx supabase db push
```

Or apply the migration manually:
```bash
psql -d your_database -f supabase/migrations/20260205000000_add_comment_mentions_and_notifications.sql
```

### 2. Verify Tables Exist

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('deal_comment_mentions', 'notifications');
```

### 3. Test the Feature

1. Navigate to any deal in the pipeline
2. Click the comments button
3. Type `@` to see the user list
4. Select a user and submit the comment
5. Check that the mentioned user receives a notification

## Components

### MentionTextarea
Location: `apps/pricing-engine/src/app/(pricing-engine)/deals/components/mention-textarea.tsx`

**Props:**
- `value: string` - Current textarea value
- `onChange: (value: string) => void` - Change handler
- `onKeyDown?: (event) => void` - Keyboard event handler
- `placeholder?: string` - Placeholder text
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable input

**Helper Functions:**
- `extractMentions(text, users)` - Extracts user IDs from @mentions
- `CommentWithMentions({ content })` - Renders text with highlighted mentions

## Notification System

### Notification Record Structure

```typescript
{
  id: string;
  user_id: string;
  type: 'mention' | 'assignment' | 'deal_update';
  title: string;
  message: string;
  link: string;
  metadata: {
    deal_id: string;
    comment_id: string;
    author_id: string;
  };
  read: boolean;
  created_at: timestamp;
}
```

### Future Enhancements

- [ ] Display notifications in a header dropdown
- [ ] Email notifications for mentions
- [ ] Slack/Teams integration
- [ ] Mark all as read functionality
- [ ] Notification preferences per user
- [ ] Digest notifications (daily/weekly summaries)

## Troubleshooting

### Mentions not working
1. Check that `/api/users` returns data
2. Verify database tables exist
3. Check browser console for errors
4. Ensure user has proper permissions

### Notifications not created
1. Check that `notifications` table exists
2. Verify RLS policies are configured
3. Check API logs for errors
4. Ensure mentioned users have valid IDs

## Testing Checklist

- [ ] Mention dropdown appears when typing `@`
- [ ] User list filters as you type
- [ ] Mentions are highlighted in comments
- [ ] Mentioned users receive notifications
- [ ] Can mention multiple users in one comment
- [ ] Cannot mention yourself (no self-notifications)
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Click selection works
- [ ] Comments submit with Shift+Enter for new line
- [ ] Comments submit with Enter (no shift)

## Security Considerations

- Users can only see mentions on deals they have access to
- Notifications are scoped to individual users (RLS enforced)
- Mention system respects existing deal access controls
- No sensitive data exposed in notification metadata
