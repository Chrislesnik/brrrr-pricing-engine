/**
 * Docs Route Tree
 *
 * All routes for the documentation application.
 * Route functions return canonical paths (no query/hash).
 *
 * RULE: Route trees export functions, not strings.
 */

import { join } from "../path";

// ============================================================================
// Route Segments
// ============================================================================

/**
 * Route segment constants for building paths
 */
export const DOCS_SEGMENTS = {
  docs: "docs",
  api: "api",
  webhooks: "webhooks",
  gettingStarted: "getting-started",
  guides: "guides",
  reference: "reference",
  search: "search",
} as const;

// ============================================================================
// Docs Routes
// ============================================================================

/**
 * Normalizes slug input to string array.
 * Accepts string (splits by /) or string[].
 */
function normalizeSlug(slug: string | string[]): string[] {
  if (Array.isArray(slug)) {
    return slug;
  }
  // Split by / and filter out empty segments
  return slug.split("/").filter(Boolean);
}

/**
 * Docs route tree.
 * All route methods return canonical paths.
 */
export const docsRoutes = {
  // -------------------------------------------------------------------------
  // Root
  // -------------------------------------------------------------------------

  /**
   * Docs home page
   * @returns /docs
   */
  root: () => `/${DOCS_SEGMENTS.docs}`,

  // -------------------------------------------------------------------------
  // Content Pages (Catch-all)
  // -------------------------------------------------------------------------

  /**
   * Documentation page by slug.
   * Handles catch-all [[...slug]] routing.
   *
   * @param slug - Single slug string (e.g., 'api/auth') or array (e.g., ['api', 'auth'])
   * @returns /docs/api/auth
   *
   * @example
   * docsRoutes.page('api/auth') // '/docs/api/auth'
   * docsRoutes.page(['api', 'auth']) // '/docs/api/auth'
   * docsRoutes.page([]) // '/docs'
   */
  page: (slug?: string | string[]) => {
    if (!slug || (Array.isArray(slug) && slug.length === 0)) {
      return `/${DOCS_SEGMENTS.docs}`;
    }

    const segments = normalizeSlug(slug);
    return join(DOCS_SEGMENTS.docs, ...segments);
  },

  // -------------------------------------------------------------------------
  // Named Sections
  // -------------------------------------------------------------------------

  /**
   * Getting started section
   * @returns /docs/getting-started
   */
  gettingStarted: () => `/${DOCS_SEGMENTS.docs}/${DOCS_SEGMENTS.gettingStarted}`,

  /**
   * API reference section
   * @returns /docs/api
   */
  api: () => `/${DOCS_SEGMENTS.docs}/${DOCS_SEGMENTS.api}`,

  /**
   * API reference subpage
   * @param slug - The API endpoint slug
   * @returns /docs/api/[slug]
   */
  apiPage: (slug: string) => join(DOCS_SEGMENTS.docs, DOCS_SEGMENTS.api, slug),

  /**
   * Webhooks section
   * @returns /docs/webhooks
   */
  webhooks: () => `/${DOCS_SEGMENTS.docs}/${DOCS_SEGMENTS.webhooks}`,

  /**
   * Webhooks subpage
   * @param slug - The webhook slug
   * @returns /docs/webhooks/[slug]
   */
  webhooksPage: (slug: string) => join(DOCS_SEGMENTS.docs, DOCS_SEGMENTS.webhooks, slug),

  /**
   * Guides section
   * @returns /docs/guides
   */
  guides: () => `/${DOCS_SEGMENTS.docs}/${DOCS_SEGMENTS.guides}`,

  /**
   * Guides subpage
   * @param slug - The guide slug
   * @returns /docs/guides/[slug]
   */
  guidesPage: (slug: string) => join(DOCS_SEGMENTS.docs, DOCS_SEGMENTS.guides, slug),

  /**
   * Reference section
   * @returns /docs/reference
   */
  reference: () => `/${DOCS_SEGMENTS.docs}/${DOCS_SEGMENTS.reference}`,

  /**
   * Reference subpage
   * @param slug - The reference slug
   * @returns /docs/reference/[slug]
   */
  referencePage: (slug: string) => join(DOCS_SEGMENTS.docs, DOCS_SEGMENTS.reference, slug),

  // -------------------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------------------

  apiRoutes: {
    /**
     * Search API
     * @returns /api/search
     */
    search: () => `/${DOCS_SEGMENTS.api}/${DOCS_SEGMENTS.search}`,
  },
} as const;
