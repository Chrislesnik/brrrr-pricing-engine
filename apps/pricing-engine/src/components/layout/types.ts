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

/**
 * Policy-engine check for a nav item.
 * When present, the item is visible only when the policy returns `allowed: true`.
 */
export interface NavPolicyCheck {
  resourceType: string
  resourceName: string
  action: string
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
   * @deprecated Prefer `policyCheck` for policy-driven visibility.
   * Optional list of organization roles that should NOT see this item.
   */
  denyOrgRoles?: string[]
  /**
   * @deprecated Prefer `policyCheck` for policy-driven visibility.
   * Optional list of organization roles that are the ONLY ones allowed to see this item.
   */
  allowOrgRoles?: string[]
  /**
   * Policy-engine visibility check. When provided, the item is visible only
   * when the policy engine grants access for the specified resource + action.
   * Takes precedence over denyOrgRoles / allowOrgRoles.
   */
  policyCheck?: NavPolicyCheck
  /**
   * Optional tooltip text shown on hover.
   */
  tooltip?: string
}

export type NavItem = BaseNavItem & {
  url?: string
  items?: NavItem[]
}

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
