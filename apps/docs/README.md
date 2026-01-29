# Developer Documentation App

A Next.js app integrated with BaseHub for managing developer documentation including API docs, webhooks, and technical guides.

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your `BASEHUB_TOKEN` from your BaseHub repo
3. Run `pnpm dev` to start development server on port 3002

## BaseHub Integration

This app uses BaseHub for content management. Follow these steps to set up:

1. Fork the BaseHub documentation template: https://github.com/basehub-ai/nextjs-docs-template
2. Create a new BaseHub repo for "Developer Documentation"
3. Deploy to Vercel
4. Get `BASEHUB_TOKEN` from repo settings
5. Configure content structure for API docs, webhooks, technical guides

## Development

```bash
pnpm dev    # Start development server on port 3002
pnpm build  # Build for production
pnpm start  # Start production server
```
