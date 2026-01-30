# Content Management Guide

This guide explains how to add and manage content in your documentation app using BaseHub.

## BaseHub Structure

Your BaseHub repository should have a `Documentation` collection with the following structure:

### Documentation Item Fields:

1. **Title** (`_title`) - The document title
2. **Slug** (`_slug`) - URL-friendly identifier (auto-generated)
3. **Category** - Select field with options:
   - `Documentation`
   - `Root`
   - Add more as needed (API, Guides, Webhooks, etc.)
4. **Rich Text** (`richText`) - The main content area

## Adding Content in BaseHub

### Step 1: Access Your BaseHub Dashboard

1. Go to [basehub.com](https://basehub.com)
2. Open your "Developer Documentation for BRRRR Pricing Engine" repository
3. Navigate to the "Documentation" collection

### Step 2: Create a New Document

1. Click "Add Item" in the Documentation collection
2. Fill in the fields:
   - **Title**: e.g., "Getting Started"
   - **Category**: Select appropriate category
   - **Rich Text**: Write your documentation content
3. Use the rich text editor features:
   - Headings (H1-H6)
   - Bold, italic, links
   - Code blocks with syntax highlighting
   - Lists (ordered and unordered)
   - Images
   - Tables

### Step 3: Organize Content

Organize your documentation by category:

#### API Documentation (`category: Documentation`)
- Authentication
- Endpoints
- Rate Limits
- Error Codes

#### Guides (`category: Root`)
- Quick Start
- Integration Guide
- Best Practices

#### Webhooks
- Webhook Setup
- Event Types
- Payload Examples

## Content Best Practices

### 1. Document Titles
- Use clear, descriptive titles
- Follow consistent naming conventions
- Keep titles concise (under 60 characters)

### 2. Slugs
- Auto-generated but can be customized
- Use lowercase and hyphens
- Make them SEO-friendly

### 3. Categories
- Use categories to organize related docs
- Keep category names short and clear
- Create new categories as needed

### 4. Rich Text Content
- Start with an introductory paragraph
- Use headings to break up sections
- Include code examples where relevant
- Add images for complex concepts
- Link to related documentation

## Example Document Structure

```markdown
# Getting Started

Welcome to the BRRRR Pricing Engine API documentation. This guide will help you get up and running quickly.

## Prerequisites

Before you begin, make sure you have:
- An active account
- API credentials
- Basic knowledge of REST APIs

## Installation

Follow these steps to integrate...

[Rest of content]
```

## Publishing Workflow

### Draft Mode (Development)
- Changes appear immediately in development
- Use `pnpm dev` to see live updates
- Test content before publishing

### Production
- Commit your changes in BaseHub
- Deploy to Vercel
- Changes go live automatically

## Search Functionality

The docs app includes full-text search powered by BaseHub:
- Search bar appears in the navigation
- Searches across titles and content
- Results include highlights
- Click to jump to the document

## Metadata & SEO

For each document, consider:
- Clear, descriptive titles
- Relevant categories
- Well-structured content with headings
- Internal links to related docs

## Tips for Great Documentation

1. **Write for your audience** - Consider their technical level
2. **Be concise** - Get to the point quickly
3. **Use examples** - Show, don't just tell
4. **Keep it updated** - Review and update regularly
5. **Link related content** - Help users discover more
6. **Test your docs** - Follow your own instructions

## Need Help?

- BaseHub Documentation: https://docs.basehub.com
- Fumadocs Guide: https://fumadocs.dev
- Project README: See `/apps/docs/README.md`
