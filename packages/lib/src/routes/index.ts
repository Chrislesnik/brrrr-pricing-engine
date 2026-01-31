/**
 * Monorepo Route Library
 *
 * Centralized routing utilities for all applications in the monorepo.
 *
 * Exports:
 * - Path building primitives (buildPath, join, qs, normalizePath)
 * - Active state helpers (isActivePath, createActiveChecker)
 * - Cross-app linking (getAppOrigin, linkToApp)
 * - Cache tag helpers (tag, listTag, entity-specific tags)
 * - App-specific route trees (pricingRoutes, docsRoutes, resourcesRoutes)
 */

// ============================================================================
// Path Primitives
// ============================================================================

export {
  qs,
  join,
  normalizePath,
  assertInternalPath,
  buildPath,
  isValidSegment,
  encodePathSegment,
  type QueryParams,
  type RouteParams,
} from "./path";

// ============================================================================
// Active State Helpers
// ============================================================================

export {
  isActivePath,
  createActiveChecker,
  findMostSpecificActive,
  type IsActiveOptions,
} from "./active";

// ============================================================================
// Cross-App Linking (Origins)
// ============================================================================

export {
  getAppOrigin,
  getAppBase,
  linkToApp,
  createAppLinker,
  isAppUrl,
  extractAppPath,
  type AppId,
} from "./origins";

// ============================================================================
// Cache Tags
// ============================================================================

export {
  TAG_PREFIXES,
  tag,
  listTag,
  orgEntityTags,
  dealTags,
  loanTags,
  applicationTags,
  borrowerTags,
  entityTags,
  brokerTags,
  orgTags,
  userTags,
  programTags,
  scenarioTags,
  documentTags,
  chatTags,
  integrationTags,
  pageTags,
  type TagPrefix,
} from "./tags";

// ============================================================================
// App Route Trees
// ============================================================================

export {
  pricingRoutes,
  pricingUrl,
  PRICING_SEGMENTS,
} from "./apps/pricing";

export {
  docsRoutes,
  DOCS_SEGMENTS,
} from "./apps/docs";

export {
  resourcesRoutes,
  RESOURCES_SEGMENTS,
} from "./apps/resources";
