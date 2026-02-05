# Fix: Organization Not Synced to Supabase

## The Problem

You're seeing this error:
```
Organization org_38MVrtrQBrhnDmbz9w90xrm24uT not found, creating it...
Failed to create organization: new row violates row-level security policy for table "organizations"
```

**Root Cause:** Your Clerk organization exists but hasn't been synced to your Supabase database yet.

---

## Solution 1: Manual Sync (FASTEST - 30 seconds)

### Step 1: Get your organization details from Clerk
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to Organizations
3. Find your organization and copy:
   - Organization ID (e.g., `org_38MVrtrQBrhnDmbz9w90xrm24uT`)
   - Organization Name
   - Organization Slug (if any)

### Step 2: Run this SQL in Supabase Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL (replace values with your org details):

```sql
-- Replace these values with your actual org details
INSERT INTO public.organizations (clerk_organization_id, name, slug)
VALUES (
  'org_38MVrtrQBrhnDmbz9w90xrm24uT',  -- Your Clerk org ID
  'My Organization Name',              -- Your org name
  'my-org-slug'                        -- Your org slug (or NULL if none)
)
ON CONFLICT (clerk_organization_id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Verify it was created
SELECT id, clerk_organization_id, name, slug 
FROM public.organizations 
WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT';
```

### Step 3: Refresh your app
Now try accessing `/org/org_38MVrtrQBrhnDmbz9w90xrm24uT/settings/documents/permissions` again!

---

## Solution 2: Configure Clerk Webhooks (PROPER FIX)

This ensures future organizations are automatically synced.

### Step 1: Create Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks**
2. Click **Add Endpoint**
3. Configure:
   - **Endpoint URL:** `https://your-domain.com/api/webhooks/clerk`
     - For local dev: Use ngrok or similar tunnel
   - **Subscribe to events:**
     - `organization.created`
     - `organization.updated`
     - `organization.deleted`
     - `organizationMembership.created`
     - `organizationMembership.updated`
     - `organizationMembership.deleted`
     - `user.created`
     - `user.updated`
     - `user.deleted`

### Step 2: Update your .env.local

Add the webhook secret from Clerk:
```
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

### Step 3: Test the webhook

Trigger it by:
- Creating a new organization in Clerk
- Updating an existing organization

---

## Solution 3: Bulk Sync All Organizations (SCRIPT)

If you have multiple organizations that need syncing, you can create a sync script:

```typescript
// scripts/sync-clerk-orgs.ts
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../src/lib/supabase-admin';

async function syncAllOrganizations() {
  const { data: orgs } = await clerkClient.organizations.getOrganizationList({
    limit: 100,
  });

  for (const org of orgs) {
    const { error } = await supabaseAdmin
      .from('organizations')
      .upsert({
        clerk_organization_id: org.id,
        name: org.name,
        slug: org.slug || null,
      }, {
        onConflict: 'clerk_organization_id',
      });

    if (error) {
      console.error(`Failed to sync org ${org.id}:`, error);
    } else {
      console.log(`✓ Synced org: ${org.name} (${org.id})`);
    }
  }

  console.log('Done!');
}

syncAllOrganizations();
```

Run with:
```bash
npx tsx scripts/sync-clerk-orgs.ts
```

---

## Why This Happened

Organizations should be automatically synced when:
1. You create them in Clerk Dashboard
2. A user creates them via your app
3. **IF** webhooks are properly configured

If webhooks weren't configured when you created your organization, it won't exist in Supabase.

---

## After Fixing

Once the organization exists in Supabase, you'll be able to:
- Access the RBAC permissions page
- Manage document permissions
- Use all org-scoped features

---

## Recommended: Use Solution 1 + Solution 2

1. **First:** Manually sync your current org (Solution 1) - gets you working immediately
2. **Then:** Set up webhooks (Solution 2) - ensures it doesn't happen again

Let me know once you've synced the organization and I'll help verify everything is working! 🚀
