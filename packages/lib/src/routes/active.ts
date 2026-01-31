/**
 * Active state helpers for navigation.
 *
 * Provides utilities to determine if a navigation item should be
 * highlighted as "active" based on the current path.
 */

import { normalizePath } from "./path";

/**
 * Options for active path matching
 */
export interface IsActiveOptions {
  /**
   * If true, only exact matches are considered active.
   * If false (default), child paths also match (e.g., /settings matches /settings/profile).
   */
  exact?: boolean;
}

/**
 * Determines if a navigation target should be considered "active"
 * based on the current path.
 *
 * Normalizes both paths (strips query/hash, removes trailing slash)
 * and matches exact or segment-boundary prefix.
 *
 * @param currentPath - The current browser path
 * @param targetPath - The navigation item's target path
 * @param options - Optional configuration
 *
 * @example
 * isActivePath('/settings', '/settings') // true (exact match)
 * isActivePath('/settings/profile', '/settings') // true (child path)
 * isActivePath('/settings-billing', '/settings') // false (not segment boundary)
 * isActivePath('/settings?tab=1', '/settings') // true (query stripped)
 * isActivePath('/settings/', '/settings') // true (trailing slash stripped)
 * isActivePath('/settings', '/settings', { exact: true }) // true
 * isActivePath('/settings/profile', '/settings', { exact: true }) // false
 */
export function isActivePath(
  currentPath: string,
  targetPath: string,
  options: IsActiveOptions = {}
): boolean {
  const { exact = false } = options;

  // Normalize both paths
  const normalizedCurrent = normalizePath(currentPath);
  const normalizedTarget = normalizePath(targetPath);

  // Exact match
  if (normalizedCurrent === normalizedTarget) {
    return true;
  }

  // If exact matching is required, no match
  if (exact) {
    return false;
  }

  // Check for segment-boundary prefix match
  // This prevents /settings from matching /settings-billing
  // but allows /settings to match /settings/profile
  return (
    normalizedCurrent.startsWith(normalizedTarget + "/") ||
    normalizedCurrent.startsWith(normalizedTarget + "?") ||
    normalizedCurrent.startsWith(normalizedTarget + "#")
  );
}

/**
 * Creates a memoized active path checker for a given current path.
 * Useful when checking multiple navigation items against the same current path.
 *
 * @param currentPath - The current browser path
 *
 * @example
 * const isActive = createActiveChecker('/settings/profile');
 * isActive('/settings') // true
 * isActive('/users') // false
 */
export function createActiveChecker(currentPath: string) {
  const normalizedCurrent = normalizePath(currentPath);

  return function isActive(targetPath: string, options: IsActiveOptions = {}): boolean {
    return isActivePath(normalizedCurrent, targetPath, options);
  };
}

/**
 * Finds the most specific active path from a list of paths.
 * Useful for determining which navigation item to highlight when
 * multiple could match.
 *
 * @param currentPath - The current browser path
 * @param paths - Array of target paths to check
 * @returns The most specific matching path, or undefined if none match
 *
 * @example
 * findMostSpecificActive('/settings/profile', ['/settings', '/settings/profile', '/users'])
 * // Returns '/settings/profile'
 */
export function findMostSpecificActive(
  currentPath: string,
  paths: string[]
): string | undefined {
  const normalizedCurrent = normalizePath(currentPath);

  // Filter to only active paths
  const activePaths = paths.filter((path) => isActivePath(currentPath, path));

  if (activePaths.length === 0) {
    return undefined;
  }

  // Sort by length (longest first) and return the most specific
  return activePaths.sort((a, b) => normalizePath(b).length - normalizePath(a).length)[0];
}
