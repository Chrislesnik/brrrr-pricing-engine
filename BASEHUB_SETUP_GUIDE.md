# BaseHub Integration Setup Guide

## ✅ Step 3 Complete - BaseHub Integration Ready!

Both `apps/resources` and `apps/docs` now have BaseHub fully integrated and ready for content management.

## What's Already Done

### Resources App (`/apps/resources`)
- ✅ basehub package installed
- ✅ fumadocs-core and fumadocs-ui installed
- ✅ BaseHub client created (`src/lib/basehub.ts`)
- ✅ Page updated with query example
- ✅ Build scripts configured
- ✅ Builds successfully (without token)

### Docs App (`/apps/docs`)
- ✅ basehub package installed
- ✅ fumadocs-core and fumadocs-ui installed
- ✅ BaseHub client created (`src/lib/basehub.ts`)
- ✅ Page updated with query example
- ✅ Build scripts configured
- ✅ Builds successfully (without token)

## Next Steps: Get BaseHub Tokens

### For Resources App

**1. Fork BaseHub Documentation Template**
```bash
# Visit and fork:
https://github.com/basehub-ai/nextjs-docs-template
```

**2. Create BaseHub Repository**
- Go to https://basehub.com
- Create new repository: "Lender Resources"
- Configure content structure for:
  - Underwriting Guidelines
  - Document Templates  
  - Help Guides
  - FAQs

**3. Get Token**
- In your BaseHub repo → Settings → API
- Copy the `BASEHUB_TOKEN`

**4. Add Token to Environment**
```bash
# Edit: apps/resources/.env.local
BASEHUB_TOKEN=bshb_pk_your_resources_token_here
```

**5. Update Development Scripts**

The package.json already has:
- `pnpm dev` - Regular dev (no BaseHub sync)
- `pnpm dev:basehub` - Dev with BaseHub real-time sync
- `pnpm build` - Regular build
- `pnpm build:basehub` - Build with BaseHub SDK generation

Once you have the token, use the `:basehub` variants!

**6. Uncomment Query in page.tsx**
```typescript
// apps/resources/src/app/page.tsx
const data = await client.query({
  documentation: {
    items: {
      _id: true,
      _title: true,
      _slug: true,
      richText: {
        json: {
          content: true,
        },
      },
    },
  },
});
```

### For Docs App

**Repeat the same process but:**
- Create separate BaseHub repo: "Developer Documentation"
- Use different `BASEHUB_TOKEN`
- Add to `apps/docs/.env.local`
- Configure content for: API docs, Webhooks, Technical guides

## BaseHub Client Configuration

Both apps have identical client setup:

```typescript
// apps/{resources|docs}/src/lib/basehub.ts
import { basehub } from "basehub";

export const client = basehub({
  token: process.env.BASEHUB_TOKEN!,
  draft: process.env.NODE_ENV === "development",
});
```

## Fumadocs Integration

Fumadocs is installed in both apps for beautiful documentation UI.

**Usage example:**
```typescript
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';

// Use for structured documentation pages
```

See: https://fumadocs.vercel.app/docs for full documentation.

## Development Workflow

### Without BaseHub Tokens (Current State)
```bash
# Resources
cd apps/resources
pnpm dev              # Port 3001

# Docs
cd apps/docs
pnpm dev              # Port 3002
```

### With BaseHub Tokens (After Setup)
```bash
# Resources with live content sync
cd apps/resources
pnpm dev:basehub      # Port 3001 + BaseHub real-time sync

# Docs with live content sync
cd apps/docs
pnpm dev:basehub      # Port 3002 + BaseHub real-time sync
```

## Example Query Structures

### Resources App
```typescript
const data = await client.query({
  underwritingGuidelines: {
    items: {
      _id: true,
      _title: true,
      category: true,
      content: {
        json: { content: true },
      },
    },
  },
  documentTemplates: {
    items: {
      _id: true,
      _title: true,
      fileUrl: true,
      description: true,
    },
  },
  helpGuides: {
    items: {
      _id: true,
      _title: true,
      _slug: true,
      content: {
        json: { content: true },
      },
    },
  },
});
```

### Docs App
```typescript
const data = await client.query({
  apiEndpoints: {
    items: {
      _id: true,
      _title: true,
      method: true,
      path: true,
      description: {
        json: { content: true },
      },
    },
  },
  webhooks: {
    items: {
      _id: true,
      _title: true,
      eventType: true,
      payload: {
        json: { content: true },
      },
    },
  },
  guides: {
    items: {
      _id: true,
      _title: true,
      _slug: true,
      content: {
        json: { content: true },
      },
    },
  },
});
```

## Build Verification

```bash
# Test both apps build
pnpm build --filter=resources --filter=docs

# Result:
✅ resources: 6.1s
✅ docs: 5.2s
```

## URLs

After setup, access at:
- Resources: http://localhost:3001
- Docs: http://localhost:3002

## Deployment to Vercel

When ready to deploy:

**Resources Project:**
- Root Directory: `apps/resources`
- Build Command: `cd ../.. && pnpm install && pnpm build:basehub --filter=resources`
- Environment Variables: Add `BASEHUB_TOKEN` for resources

**Docs Project:**
- Root Directory: `apps/docs`
- Build Command: `cd ../.. && pnpm install && pnpm build:basehub --filter=docs`
- Environment Variables: Add `BASEHUB_TOKEN` for docs

## Quick Reference

| Task | Command |
|------|---------|
| Dev without BaseHub | `pnpm dev` |
| Dev with BaseHub sync | `pnpm dev:basehub` |
| Build without BaseHub | `pnpm build` |
| Build with BaseHub | `pnpm build:basehub` |

## Summary

✅ **BaseHub integration is complete and ready**
✅ **Both apps build successfully**
✅ **fumadocs installed for beautiful docs UI**
✅ **Client configuration in place**
⏳ **Waiting for BaseHub repo creation and tokens**

**Next:** Create your BaseHub repos and add the tokens to enable live content management!

---

**Reference:** https://docs.basehub.com/nextjs-integration/start-here
