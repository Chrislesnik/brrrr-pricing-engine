interface User {
  name: string
  email: string
  avatar: string
}

interface Team {
  name: string
  logo: React.ElementType
  plan: string
}

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
  /**
   * Optional Clerk permission key required to view this nav item.
   * Example: "org:manage_programs"
   */
  requiredPermission?: string
  /**
   * Optional list of organization roles that should NOT see this item.
   * Accepts either Clerk-style roles (e.g. "org:broker") or bare roles (e.g. "broker").
   * We will compare against both the Clerk `orgRole` and its version without the "org:" prefix.
   */
  denyOrgRoles?: string[]
  /**
   * Optional list of organization roles that are the ONLY ones allowed to see this item.
   * If provided, this check takes precedence (even for owners).
   */
  allowOrgRoles?: string[]
}

export type NavItem =
  | (BaseNavItem & {
      items: (BaseNavItem & { url: string })[]
      url?: never
    })
  | (BaseNavItem & {
      url: string
      items?: never
    })

interface NavGroup {
  title: string
  items: NavItem[]
}

interface SidebarData {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup }
