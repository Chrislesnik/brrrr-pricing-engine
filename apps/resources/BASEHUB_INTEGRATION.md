# BaseHub + Fumadocs Integration

## Overview

The resources app now uses BaseHub as a headless CMS with Fumadocs for documentation rendering. Content is automatically synced from your BaseHub repository and displayed with dynamic routing.

## Features Implemented

### 1. **Dynamic Routing**
- **Root Page**: `/resources` - Shows all documentation items grouped by category
- **Document Pages**: `/resources/{slug}` - Shows individual document content
- Automatic route generation from BaseHub content

### 2. **Dynamic Sidebar Navigation**
- Sidebar automatically populated from BaseHub content
- Items grouped by category (Documentation, Root, etc.)
- Active page highlighting
- Real-time updates in development (draft mode)

### 3. **Content Management**
- All content managed through BaseHub CMS
- Rich text rendering with BaseHub's RichText component
- Categories for organizing content
- SEO metadata generation

### 4. **Settings Popover with Draft Mode** ⭐ NEW
- **⚙️ Settings icon** in header for quick access
- **BaseHub Toolbar** integrated for easy draft mode toggle
- **One-click draft mode** - No more navigating to API routes!
- **Theme switcher** (Light/Dark/System)
- **Direct link** to BaseHub dashboard
- See: `SETTINGS_POPOVER_GUIDE.md` for details

## File Structure

```
apps/resources/
├── src/
│   ├── app/
│   │   └── resources/
│   │       ├── layout.tsx          # Fetches nav structure from BaseHub
│   │       ├── page.tsx            # Root page with categorized content
│   │       └── [[...slug]]/
│   │           └── page.tsx        # Dynamic pages for each document
│   ├── components/
│   │   └── layout/
│   │       └── resources-sidebar.tsx  # Dynamic sidebar component
│   └── lib/
│       └── basehub.ts              # BaseHub client configuration
├── basehub-types.d.ts              # Auto-generated TypeScript types
└── basehub.config.ts               # BaseHub configuration
```

## BaseHub Repository Structure

Your BaseHub repository schema:

```
Query
├── _sys { id, title }
└── documentation
    └── items (DocumentationItem[])
        ├── _id
        ├── _slug        # Used for routing
        ├── _title       # Display name
        ├── category     # "Documentation" or "Root"
        └── richText     # Content with json.content
```

## How It Works

### 1. Content Fetching

Pages use BaseHub's `Pump` component for server-side rendering:

```tsx
<Pump
  draft={isEnabled}
  queries={[
    {
      documentation: {
        items: {
          _id: true,
          _title: true,
          _slug: true,
          category: true,
        },
      },
    },
  ]}
>
  {async ([data]) => {
    // Render with data
  }}
</Pump>
```

### 2. Navigation Building

The layout fetches all documentation items and builds a `PageTree` structure:

```typescript
const items: PageTree.Node[] = [];
const categoryGroups: Record<string, PageTree.Node[]> = {};

// Group by category
for (const item of documentation.items) {
  const pageNode = {
    type: "page",
    name: item._title,
    url: `/resources/${item._slug}`,
  };
  
  if (item.category !== "Root") {
    categoryGroups[item.category].push(pageNode);
  } else {
    items.push(pageNode);
  }
}

// Add category separators
for (const [category, pages] of Object.entries(categoryGroups)) {
  items.push({ type: "separator", name: category });
  items.push(...pages);
}
```

### 3. Dynamic Routing

URLs automatically map to BaseHub slugs:
- `/resources` → Root page (all documents)
- `/resources/getting-started` → Document with slug "getting-started"
- `/resources/api/authentication` → Document with slug "api/authentication"

## Managing Content

### Adding New Documents

1. **Enable Draft Mode**
   - Click ⚙️ Settings icon in header
   - Toggle "Draft Mode" switch ON

2. Go to [BaseHub Dashboard](https://basehub.com/dashboard)
   - Or click "Open BaseHub Dashboard" in settings popover
   
3. Navigate to your "brrrr-pricing-engine-resources" repository

4. Click "Documentation" → "Add Item"

5. Fill in:
   - **Title**: Display name
   - **Slug**: URL path (auto-generated)
   - **Category**: "Documentation" or "Root"
   - **Rich Text**: Your content

6. **Save** (but don't commit yet)

7. Preview changes in your app - they appear instantly!

8. When satisfied, **commit** in BaseHub

9. Toggle Draft Mode OFF to see published version

### Content appears immediately in development (draft mode)

## Development

### Draft Mode

In development, draft mode is automatically enabled, showing uncommitted changes:

```typescript
// lib/basehub.ts
export const client = basehub({
  token: process.env.BASEHUB_TOKEN!,
  draft: process.env.NODE_ENV === "development",
});
```

### Type Safety

BaseHub generates TypeScript types automatically:

```bash
# Regenerate types after schema changes
pnpm run dev  # Types regenerate on start
```

## Production

### Building

```bash
cd apps/resources
pnpm build  # Generates static pages for all documents
```

### Environment Variables

Required in production (`.env` or Vercel):

```bash
BASEHUB_TOKEN=bshb_pk_your_token_here
```

## Troubleshooting

### Content Not Showing

1. Check BaseHub token in `.env.local`
2. Verify repository structure matches schema
3. Check browser console for GraphQL errors

### Type Errors

```bash
# Regenerate types
pnpm dev
# or manually
pnpm basehub
```

### Route Conflicts

The warning about route specificity is expected and doesn't affect functionality:
```
⚠ You cannot define a route with the same specificity as a optional catch-all route
```

This occurs because we have both `/resources/page.tsx` (root) and `/resources/[[...slug]]/page.tsx` (dynamic). The root page handles the index, and dynamic pages handle documents.

## Next Steps

### Recommended Enhancements

1. **Add Search**: Integrate BaseHub's search capabilities
2. **Table of Contents**: Show TOC from `richText.json.toc`
3. **Breadcrumbs**: Multi-level navigation
4. **Analytics**: Track page views with BaseHub analytics
5. **Versioning**: Use BaseHub branches for version control

### Example Content Structure

```
Documentation (Category: Documentation)
├── Getting Started
├── Installation Guide
└── Configuration

API Reference (Category: Root)
├── Authentication
├── Endpoints
└── Rate Limits

Templates (Category: Documentation)
├── Underwriting Template
└── Approval Letter Template
```

## Resources

- [BaseHub Documentation](https://docs.basehub.com)
- [Fumadocs Documentation](https://fumadocs.dev)
- [BaseHub Dashboard](https://basehub.com/dashboard)
