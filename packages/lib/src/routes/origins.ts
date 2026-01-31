/**
 * Cross-app linking helpers for the monorepo.
 *
 * Provides utilities for generating URLs across different applications
 * that may be deployed on different hostnames.
 *
 * Environment Variables Contract:
 * | Variable                       | Description                                     | Example                       |
 * | ------------------------------ | ----------------------------------------------- | ----------------------------- |
 * | NEXT_PUBLIC_PRICING_ORIGIN     | Origin for pricing app (no trailing slash)      | https://app.brrrr.com         |
 * | NEXT_PUBLIC_DOCS_ORIGIN        | Origin for docs app (no trailing slash)         | https://docs.brrrr.com        |
 * | NEXT_PUBLIC_RESOURCES_ORIGIN   | Origin for resources app (no trailing slash)    | https://resources.brrrr.com   |
 * | NEXT_PUBLIC_PRICING_BASE       | Optional base path (leading slash, no trailing) | "" (default)                  |
 * | NEXT_PUBLIC_DOCS_BASE          | Optional base path (leading slash, no trailing) | /docs                         |
 * | NEXT_PUBLIC_RESOURCES_BASE     | Optional base path (leading slash, no trailing) | /resources                    |
 */

import { normalizePath } from "./path";

/**
 * Available app identifiers
 */
export type AppId = "pricing" | "docs" | "resources";

/**
 * Environment variable keys for app origins
 */
const ORIGIN_ENV_KEYS: Record<AppId, string> = {
  pricing: "NEXT_PUBLIC_PRICING_ORIGIN",
  docs: "NEXT_PUBLIC_DOCS_ORIGIN",
  resources: "NEXT_PUBLIC_RESOURCES_ORIGIN",
};

/**
 * Environment variable keys for app base paths
 */
const BASE_ENV_KEYS: Record<AppId, string> = {
  pricing: "NEXT_PUBLIC_PRICING_BASE",
  docs: "NEXT_PUBLIC_DOCS_BASE",
  resources: "NEXT_PUBLIC_RESOURCES_BASE",
};

/**
 * Default origins for development (when env vars are not set)
 */
const DEFAULT_ORIGINS: Record<AppId, string> = {
  pricing: "http://localhost:3000",
  docs: "http://localhost:3001",
  resources: "http://localhost:3002",
};

/**
 * Gets the origin (scheme + host) for the given app based on environment variables.
 *
 * Falls back to localhost with different ports for development.
 *
 * @param app - The app identifier
 * @returns The origin URL (no trailing slash)
 *
 * @example
 * getAppOrigin('docs') // 'https://docs.brrrr.com' (from env)
 * getAppOrigin('docs') // 'http://localhost:3001' (fallback)
 */
export function getAppOrigin(app: AppId): string {
  const envKey = ORIGIN_ENV_KEYS[app];
  const envValue = typeof process !== "undefined" ? process.env[envKey] : undefined;

  if (envValue) {
    // Remove trailing slash if present
    return envValue.replace(/\/+$/, "");
  }

  return DEFAULT_ORIGINS[app];
}

/**
 * Gets the optional base path for the given app.
 *
 * @param app - The app identifier
 * @returns The base path (with leading slash, no trailing slash) or empty string
 *
 * @example
 * getAppBase('docs') // '/docs' or ''
 */
export function getAppBase(app: AppId): string {
  const envKey = BASE_ENV_KEYS[app];
  const envValue = typeof process !== "undefined" ? process.env[envKey] : undefined;

  if (!envValue) {
    return "";
  }

  // Ensure leading slash, no trailing slash
  let base = envValue;
  if (!base.startsWith("/")) {
    base = "/" + base;
  }
  return base.replace(/\/+$/, "");
}

/**
 * Constructs an absolute URL for cross-app navigation.
 *
 * - If the path is already absolute (starts with http/https), returns it as-is
 * - If the path is internal (/foo), combines origin + base + normalized path
 * - Throws if the path is invalid (no leading slash for internal paths)
 *
 * @param app - The target app identifier
 * @param path - The path within that app
 * @returns Absolute URL for the target
 *
 * @example
 * linkToApp('docs', '/api/auth') // 'https://docs.brrrr.com/docs/api/auth'
 * linkToApp('pricing', '/settings') // 'https://app.brrrr.com/settings'
 */
export function linkToApp(app: AppId, path: string): string {
  // If already absolute, return as-is
  if (path.startsWith("https://") || path.startsWith("http://")) {
    return path;
  }

  // Validate internal path
  if (!path.startsWith("/")) {
    throw new Error(`Internal paths must start with /: ${path}`);
  }

  const origin = getAppOrigin(app);
  const base = getAppBase(app);
  const normalizedPath = normalizePath(path);

  // Combine, avoiding double slashes
  if (base) {
    return `${origin}${base}${normalizedPath}`;
  }

  return `${origin}${normalizedPath}`;
}

/**
 * Creates a URL builder for a specific app.
 * Useful when generating multiple links to the same app.
 *
 * @param app - The target app identifier
 * @returns A function that builds URLs for that app
 *
 * @example
 * const docsUrl = createAppLinker('docs');
 * docsUrl('/api/auth') // 'https://docs.brrrr.com/docs/api/auth'
 * docsUrl('/guides') // 'https://docs.brrrr.com/docs/guides'
 */
export function createAppLinker(app: AppId) {
  return function link(path: string): string {
    return linkToApp(app, path);
  };
}

/**
 * Checks if a URL is for a specific app.
 *
 * @param url - The URL to check
 * @param app - The app to check against
 * @returns True if the URL is for the specified app
 */
export function isAppUrl(url: string, app: AppId): boolean {
  const origin = getAppOrigin(app);
  return url.startsWith(origin);
}

/**
 * Extracts the path from an app URL (removes origin and base).
 *
 * @param url - The full URL
 * @param app - The app the URL belongs to
 * @returns The path portion, or null if not a valid app URL
 */
export function extractAppPath(url: string, app: AppId): string | null {
  const origin = getAppOrigin(app);
  const base = getAppBase(app);

  if (!url.startsWith(origin)) {
    return null;
  }

  let path = url.slice(origin.length);

  // Remove base if present
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }

  return path || "/";
}
