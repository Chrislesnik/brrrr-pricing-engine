# Developer Documentation App

A Next.js documentation site powered by Fumadocs + BaseHub for the BRRRR Pricing Engine platform.

## ✅ Features

- 🎨 **Modern Design** - Aligned with your global theme (Shadcn UI)
- 📝 **Content Management** - Powered by BaseHub CMS
- 🔍 **Full-Text Search** - Search across all documentation
- 🎯 **Category Organization** - Organize docs by type
- 🌙 **Dark Mode** - Automatic dark mode support
- 📱 **Responsive** - Mobile-friendly documentation
- ⚡ **Fast** - Built with Next.js 16 and optimized for performance

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Your `.env.local` already contains the BaseHub token:

```bash
BASEHUB_TOKEN=bshb_pk_ye9dx1o3ut6j34ky99l4m9f8ixltp5fyz6h7sn0ornzercan4gg9ibfjzvpea4dw
```

### 3. Start Development Server

```bash
pnpm dev    # Runs on http://localhost:3002
```

## 📚 Adding Content

See [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) for detailed instructions on managing documentation content in BaseHub.

### Quick Overview:

1. Go to your BaseHub dashboard
2. Navigate to "Documentation" collection
3. Click "Add Item"
4. Fill in:
   - **Title**: Document name
   - **Category**: Documentation, Root, etc.
   - **Rich Text**: Your content
5. Save and see it appear automatically in dev mode

## 🎨 Design System

This app is fully integrated with your global theme:

- Uses `@repo/ui/globals.css` for consistent styling
- Fumadocs Base UI components styled with your theme
- All CSS variables aligned with Shadcn UI
- Dark mode automatically handled

## 📁 Project Structure

```
apps/docs/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── docs/
│   │   │   ├── layout.tsx        # Docs layout (Fumadocs)
│   │   │   ├── page.tsx          # Docs index
│   │   │   └── [[...slug]]/      # Dynamic doc pages
│   │   └── api/
│   │       └── search/           # Search API endpoint
│   ├── components/
│   │   └── search.tsx            # Search component
│   └── lib/
│       ├── basehub.ts            # BaseHub client
│       └── source.ts             # Content helpers
├── CONTENT_GUIDE.md              # Content management guide
└── package.json
```

## 🔧 Configuration Files

- `tailwind.config.ts` - Tailwind + Typography plugin
- `basehub.config.ts` - BaseHub configuration
- `next.config.ts` - Next.js configuration

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repo to Vercel
2. Set root directory: `apps/docs`
3. Add environment variable: `BASEHUB_TOKEN`
4. Deploy!

Build command is already configured in `package.json`:
```bash
pnpm build  # Generates types and builds Next.js
```

## 📖 Documentation URLs

- Home: `/`
- Docs Index: `/docs`
- Individual Docs: `/docs/{slug}`
- Search API: `/api/search?q=query`

## 🎯 Features in Detail

### Search
- Real-time search as you type
- Searches titles and content
- Keyboard accessible
- Shows category labels

### Categories
- Organize docs by type (API, Guides, etc.)
- Filter by category on index page
- Color-coded badges

### Rich Text
- Full Markdown support
- Code syntax highlighting
- Tables, lists, images
- Headings with auto-IDs

## 🛠️ Development Commands

```bash
pnpm dev          # Start dev server with BaseHub sync
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Lint code
pnpm format       # Check formatting
pnpm format:fix   # Fix formatting
pnpm check-types  # Type checking
```

## 📚 Resources

- [Fumadocs Documentation](https://fumadocs.dev)
- [BaseHub Documentation](https://docs.basehub.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Content Management Guide](./CONTENT_GUIDE.md)

## 🎨 Theme Customization

The app uses CSS variables from your global theme. To customize Fumadocs styling, edit the `--fd-*` variables in `packages/ui/src/globals.css`:

```css
:root {
  --fd-primary: 0 0% 0%;
  --fd-background: 0 0% 100%;
  /* ... more variables */
}
```

## ✅ Status

- ✅ BaseHub connected and working
- ✅ Fumadocs UI integrated
- ✅ Theme aligned with globals.css
- ✅ Search functionality
- ✅ Dark mode support
- ✅ Mobile responsive
- ✅ Ready for content!
