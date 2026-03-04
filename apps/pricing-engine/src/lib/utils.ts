import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a Clerk organization role has privileged (admin/owner) access.
 * Handles both "owner" and "org:owner" formats.
 */
export function isPrivilegedRole(role: string | null): boolean {
  if (!role) return false
  const normalizedRole = role.replace(/^org:/, "")
  return normalizedRole === "owner" || normalizedRole === "admin"
}
