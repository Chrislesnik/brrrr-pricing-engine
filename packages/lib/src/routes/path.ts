/**
 * Route path building primitives for the monorepo.
 *
 * These utilities provide type-safe, consistent route construction
 * across all applications.
 */

/**
 * Query string parameters type
 */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Route parameters for dynamic segments
 */
export type RouteParams = Record<string, string | string[] | undefined>;

/**
 * Generates a query string from an object of parameters.
 * Filters out undefined and null values.
 *
 * @example
 * qs({ status: 'draft', page: 1 }) // '?status=draft&page=1'
 * qs({ status: undefined }) // ''
 */
export function qs(params: QueryParams): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (entries.length === 0) return "";

  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }

  return `?${searchParams.toString()}`;
}

/**
 * Safely joins URL path segments, handling slashes correctly.
 * Removes duplicate slashes and ensures proper formatting.
 *
 * @example
 * join('/users', 'profile') // '/users/profile'
 * join('/users/', '/profile/') // '/users/profile'
 * join('users', 'profile', 'settings') // '/users/profile/settings'
 */
export function join(...parts: (string | undefined)[]): string {
  const filtered = parts.filter((p): p is string => typeof p === "string" && p.length > 0);

  if (filtered.length === 0) return "/";

  const joined = filtered
    .map((part, i) => {
      // Remove leading slash except for first part
      let cleaned = i > 0 ? part.replace(/^\/+/, "") : part;
      // Remove trailing slash
      cleaned = cleaned.replace(/\/+$/, "");
      return cleaned;
    })
    .filter(Boolean)
    .join("/");

  // Ensure leading slash
  return joined.startsWith("/") ? joined : `/${joined}`;
}

/**
 * Normalizes a path by:
 * - Stripping query strings and hashes
 * - Removing trailing slashes (except for root)
 * - Removing duplicate slashes
 *
 * @example
 * normalizePath('/settings/') // '/settings'
 * normalizePath('/settings?foo=bar') // '/settings'
 * normalizePath('/settings#section') // '/settings'
 * normalizePath('//settings//profile//') // '/settings/profile'
 */
export function normalizePath(path: string): string {
  // Remove query string and hash
  let normalized = path.split("?")[0]?.split("#")[0] ?? "";

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, "/");

  // Remove trailing slash (but keep root)
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

/**
 * Asserts that a path is valid for internal navigation.
 *
 * - Allows absolute URLs (https://, http://, mailto:, tel:)
 * - Rejects protocol-relative URLs (//evil.com)
 * - Rejects internal paths without leading slash
 *
 * @throws Error if the path is invalid
 *
 * @example
 * assertInternalPath('/settings') // OK
 * assertInternalPath('https://example.com') // OK (external)
 * assertInternalPath('//evil.com') // throws
 * assertInternalPath('settings') // throws
 */
export function assertInternalPath(path: string): void {
  // Allow absolute URLs with known protocols
  if (
    path.startsWith("https://") ||
    path.startsWith("http://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return;
  }

  // Reject protocol-relative URLs
  if (path.startsWith("//")) {
    throw new Error(`Protocol-relative URLs are not allowed: ${path}`);
  }

  // Require leading slash for internal paths
  if (!path.startsWith("/")) {
    throw new Error(`Internal paths must start with /: ${path}`);
  }
}

/**
 * Builds a URL path by replacing dynamic segments in a template.
 *
 * Supports:
 * - `[param]` - Single dynamic segment (requires string value)
 * - `[...slug]` - Catch-all segment (requires string[] value)
 * - `[[...slug]]` - Optional catch-all (accepts string[], undefined, or empty array)
 *
 * @example
 * buildPath('/users/[id]', { id: '123' }) // '/users/123'
 * buildPath('/docs/[...slug]', { slug: ['api', 'auth'] }) // '/docs/api/auth'
 * buildPath('/blog/[[...slug]]', { slug: [] }) // '/blog'
 * buildPath('/blog/[[...slug]]', { slug: undefined }) // '/blog'
 */
export function buildPath(
  template: string,
  params: RouteParams = {},
  query: QueryParams = {}
): string {
  let result = template;

  // Handle optional catch-all segments [[...param]]
  const optionalCatchAllRegex = /\[\[\.\.\.(\w+)\]\]/g;
  result = result.replace(optionalCatchAllRegex, (match, paramName: string) => {
    const value = params[paramName];

    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      return "";
    }

    if (!Array.isArray(value)) {
      throw new Error(`Optional catch-all parameter "${paramName}" must be an array, got: ${typeof value}`);
    }

    return value.join("/");
  });

  // Handle required catch-all segments [...param]
  const catchAllRegex = /\[\.\.\.(\w+)\]/g;
  result = result.replace(catchAllRegex, (match, paramName: string) => {
    const value = params[paramName];

    if (!Array.isArray(value)) {
      throw new Error(`Catch-all parameter "${paramName}" must be an array, got: ${typeof value}`);
    }

    if (value.length === 0) {
      throw new Error(`Catch-all parameter "${paramName}" cannot be empty`);
    }

    return value.join("/");
  });

  // Handle single dynamic segments [param]
  const singleParamRegex = /\[(\w+)\]/g;
  result = result.replace(singleParamRegex, (match, paramName: string) => {
    const value = params[paramName];

    if (value === undefined) {
      throw new Error(`Missing required parameter: ${paramName}`);
    }

    if (Array.isArray(value)) {
      throw new Error(`Single parameter "${paramName}" cannot be an array`);
    }

    return encodeURIComponent(value);
  });

  // Clean up any double slashes from empty optional segments
  result = normalizePath(result);

  // Append query string if provided
  const queryString = qs(query);
  return result + queryString;
}

/**
 * Type guard to check if a value is a valid non-empty string
 */
export function isValidSegment(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Encodes path segments safely for URLs
 */
export function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/%2F/g, "/");
}
