# Draft Mode Guide - BaseHub Integration

## Overview

Draft mode allows you to preview uncommitted changes from your BaseHub repository before publishing them. This is essential for reviewing content changes in a production-like environment.

## How Draft Mode Works

When draft mode is enabled:
- **✅ Shows uncommitted changes** from BaseHub
- **✅ Real-time content updates** as you edit in BaseHub
- **✅ No impact on production** content
- **✅ Visual indicator** shows draft mode is active

When draft mode is disabled:
- Shows only **committed/published** content
- This is what end users see in production

## Enabling Draft Mode

### Method 1: Manual URL (Development)

Visit this URL to enable draft mode:

```
http://localhost:3001/api/draft
```

Or with a specific page to redirect to:

```
http://localhost:3001/api/draft?slug=/resources/getting-started
```

### Method 2: BaseHub Preview Button (Recommended)

1. Go to your BaseHub dashboard
2. Edit any document in "brrrr-pricing-engine-resources"
3. Look for the **Preview** button in the top-right
4. Click it to open your site in draft mode

### Method 3: BaseHub Toolbar Integration

The BaseHub toolbar automatically handles draft mode when you use the preview feature.

## Disabling Draft Mode

### Option 1: Use the Draft Mode Indicator

When draft mode is active, you'll see a **yellow indicator** in the bottom-right corner:

```
┌─────────────────────────┐
│ 👁 Draft Mode Active    │
│            [Disable]    │
└─────────────────────────┘
```

Click **Disable** to exit draft mode.

### Option 2: Manual URL

Visit:

```
http://localhost:3001/api/disable-draft
```

Or with a specific page:

```
http://localhost:3001/api/disable-draft?slug=/resources
```

## Configuration

### Current Setup

Draft mode is configured in your app:

**1. BaseHub Client** (`src/lib/basehub.ts`):
```typescript
export const client = basehub({
  token: process.env.BASEHUB_TOKEN!,
  draft: process.env.NODE_ENV === "development",
});
```

**2. Draft Mode Routes**:
- `/api/draft` - Enables draft mode
- `/api/disable-draft` - Disables draft mode

**3. Draft Mode Indicator**:
- Shows when draft mode is active
- Provides quick disable button
- Located in bottom-right corner

### Environment Variables

Ensure your `.env.local` has:

```bash
BASEHUB_TOKEN=bshb_pk_your_token_here
NODE_ENV=development
```

## Usage Workflow

### Typical Content Review Workflow

1. **Edit in BaseHub**
   - Log in to BaseHub dashboard
   - Navigate to "brrrr-pricing-engine-resources"
   - Edit or create content (don't commit yet)

2. **Preview Changes**
   - Click **Preview** in BaseHub
   - Your site opens with draft mode enabled
   - See your uncommitted changes in real-time

3. **Review Content**
   - Navigate through pages
   - Check formatting and layout
   - Test links and images

4. **Make Adjustments**
   - Go back to BaseHub
   - Edit content as needed
   - Changes appear immediately in preview

5. **Publish**
   - When satisfied, **Commit** changes in BaseHub
   - Disable draft mode to see published version
   - Changes now visible to all users

## Technical Details

### How Pages Check Draft Mode

Every page component checks draft mode status:

```typescript
export default async function ResourcePage() {
  const { isEnabled } = await draftMode();
  
  return (
    <Pump
      draft={isEnabled}  // ← Fetches uncommitted content
      queries={[...]}
    >
      ...
    </Pump>
  );
}
```

### Draft Mode Persistence

Draft mode is stored in a **cookie**:
- Cookie name: `__prerender_bypass`
- Persists across page navigations
- Automatically cleared when disabled
- Session-based (doesn't persist after browser close)

### Security

Draft mode routes are:
- ✅ Safe for production deployment
- ✅ Don't expose sensitive data
- ✅ Only show content you can already access in BaseHub
- ⚠️ For extra security, add authentication:

```typescript
// src/app/api/draft/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  // Optional: Add secret token check
  if (secret !== process.env.DRAFT_SECRET) {
    return new Response("Invalid token", { status: 401 });
  }
  
  // ... rest of code
}
```

## Troubleshooting

### Draft Mode Not Working

**Problem**: Changes not appearing after enabling draft mode

**Solutions**:
1. Check the yellow indicator is showing
2. Verify `BASEHUB_TOKEN` in `.env.local`
3. Clear cookies and re-enable draft mode
4. Check BaseHub dashboard - are changes saved (but uncommitted)?

### Changes Not Updating

**Problem**: Edited content in BaseHub but not seeing updates

**Solutions**:
1. Make sure changes are **saved** in BaseHub (not just committed)
2. Refresh the page (Cmd+R / Ctrl+R)
3. Check draft mode is still enabled
4. Verify you're editing the correct repository

### Draft Mode Indicator Not Showing

**Problem**: Draft mode is enabled but no yellow indicator

**Solutions**:
1. Check browser console for errors
2. Verify you're on a `/resources/*` route
3. Check that `DraftModeIndicator` component is imported in layout

### Production Concerns

**Q**: Will draft mode affect production users?

**A**: No. Draft mode is:
- Per-session (cookie-based)
- Requires manual enablement
- Only shows to users who enable it
- Doesn't affect other users

**Q**: Should I deploy draft mode routes to production?

**A**: Yes! Draft mode is designed for production use. It allows:
- Content team to preview before publishing
- Stakeholders to review content
- Safe testing without affecting users

## Best Practices

1. **Always Use Draft Mode for Content Review**
   - Never publish directly without preview
   - Review on actual site, not just BaseHub

2. **Disable Draft Mode When Done**
   - Prevents confusion about what's published
   - See the actual user experience

3. **Use with BaseHub Branches** (Optional)
   - Create branches for major changes
   - Preview branches with draft mode
   - Merge when ready

4. **Test Across Devices**
   - Draft mode works on mobile too
   - Preview responsive layouts before publishing

## Resources

- [Next.js Draft Mode Docs](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode)
- [BaseHub Preview Docs](https://docs.basehub.com)
- [BaseHub Dashboard](https://basehub.com/dashboard)
