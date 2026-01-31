/**
 * Resources Route Tree
 *
 * All routes for the resources application.
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
export const RESOURCES_SEGMENTS = {
  resources: "resources",
  guidelines: "guidelines",
  templates: "templates",
  help: "help",
  downloads: "downloads",
  faq: "faq",
} as const;

// ============================================================================
// Resources Routes
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
 * Resources route tree.
 * All route methods return canonical paths.
 */
export const resourcesRoutes = {
  // -------------------------------------------------------------------------
  // Root
  // -------------------------------------------------------------------------

  /**
   * Resources home page
   * @returns /resources
   */
  root: () => `/${RESOURCES_SEGMENTS.resources}`,

  // -------------------------------------------------------------------------
  // Content Pages (Catch-all)
  // -------------------------------------------------------------------------

  /**
   * Resources page by slug.
   * Handles catch-all routing.
   *
   * @param slug - Single slug string or array
   * @returns /resources/[...slug]
   *
   * @example
   * resourcesRoutes.page('guidelines/dscr') // '/resources/guidelines/dscr'
   * resourcesRoutes.page(['guidelines', 'dscr']) // '/resources/guidelines/dscr'
   */
  page: (slug?: string | string[]) => {
    if (!slug || (Array.isArray(slug) && slug.length === 0)) {
      return `/${RESOURCES_SEGMENTS.resources}`;
    }

    const segments = normalizeSlug(slug);
    return join(RESOURCES_SEGMENTS.resources, ...segments);
  },

  // -------------------------------------------------------------------------
  // Named Sections
  // -------------------------------------------------------------------------

  /**
   * Underwriting guidelines section
   * @returns /resources/guidelines
   */
  guidelines: () => `/${RESOURCES_SEGMENTS.resources}/${RESOURCES_SEGMENTS.guidelines}`,

  /**
   * Guidelines subpage
   * @param slug - The guideline slug
   * @returns /resources/guidelines/[slug]
   */
  guidelinesPage: (slug: string) =>
    join(RESOURCES_SEGMENTS.resources, RESOURCES_SEGMENTS.guidelines, slug),

  /**
   * Document templates section
   * @returns /resources/templates
   */
  templates: () => `/${RESOURCES_SEGMENTS.resources}/${RESOURCES_SEGMENTS.templates}`,

  /**
   * Templates subpage
   * @param slug - The template slug
   * @returns /resources/templates/[slug]
   */
  templatesPage: (slug: string) =>
    join(RESOURCES_SEGMENTS.resources, RESOURCES_SEGMENTS.templates, slug),

  /**
   * Help guides section
   * @returns /resources/help
   */
  help: () => `/${RESOURCES_SEGMENTS.resources}/${RESOURCES_SEGMENTS.help}`,

  /**
   * Help subpage
   * @param slug - The help article slug
   * @returns /resources/help/[slug]
   */
  helpPage: (slug: string) =>
    join(RESOURCES_SEGMENTS.resources, RESOURCES_SEGMENTS.help, slug),

  /**
   * Downloads section
   * @returns /resources/downloads
   */
  downloads: () => `/${RESOURCES_SEGMENTS.resources}/${RESOURCES_SEGMENTS.downloads}`,

  /**
   * FAQ section
   * @returns /resources/faq
   */
  faq: () => `/${RESOURCES_SEGMENTS.resources}/${RESOURCES_SEGMENTS.faq}`,
} as const;
