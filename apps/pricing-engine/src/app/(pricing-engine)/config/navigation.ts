import { type LucideIcon } from "lucide-react";
import {
  IconApps,
  IconSettings,
  IconUsers,
  IconUser,
  IconSparkles,
  IconInbox,
  IconPlug,
  IconBuilding,
} from "@tabler/icons-react";
import { pricingRoutes, PRICING_SEGMENTS, isActivePath } from "@repo/lib/routes";

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
  title: string;
  url?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  items?: NavItem[];

  // RBAC
  requiredPermission?: string;
  denyOrgRoles?: string[];
  allowOrgRoles?: string[];

  // UI
  badge?: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: string[]; // e.g. ["⌘", "P"]
}

// ============================================================================
// RE-EXPORT ROUTE SEGMENTS (for backward compatibility)
// ============================================================================

export const ROUTE_SEGMENTS = PRICING_SEGMENTS;

// ============================================================================
// RE-EXPORT ROUTES (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use pricingRoutes from @repo/lib/routes instead
 */
export const ROUTES = {
  dashboard: pricingRoutes.dashboard(),
  pipeline: pricingRoutes.pipeline(),
  applications: pricingRoutes.applications(),
  applicants: {
    borrowers: pricingRoutes.applicants.borrowers(),
    entities: pricingRoutes.applicants.entities(),
  },
  brokers: pricingRoutes.brokers(),
  aiAgent: pricingRoutes.aiAgent(),
  settings: {
    programs: pricingRoutes.settings.programs(),
    integrations: pricingRoutes.settings.integrations(),
    company: pricingRoutes.settings.company(),
  },
} as const;

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    title: "Main",
    items: [
      {
        title: "Pipeline",
        url: pricingRoutes.pipeline(),
        icon: IconUsers,
        shortcut: ["P"],
      },
      {
        title: "Loan Setup",
        icon: IconApps,
        items: [
          {
            title: "Applications",
            url: pricingRoutes.applications(),
            icon: IconInbox,
            shortcut: ["A"],
          },
        ],
      },
      {
        title: "Applicants",
        icon: IconUsers,
        items: [
          {
            title: "Borrowers",
            url: pricingRoutes.applicants.borrowers(),
            icon: IconUser,
            shortcut: ["B"],
          },
          {
            title: "Entities",
            url: pricingRoutes.applicants.entities(),
            icon: IconBuilding,
            shortcut: ["E"],
          },
        ],
      },
      {
        title: "Brokers",
        url: pricingRoutes.brokers(),
        icon: IconUser,
        denyOrgRoles: ["org:broker", "broker"],
        shortcut: ["K"],
      },
      {
        title: "AI Agent",
        url: pricingRoutes.aiAgent(),
        icon: IconSparkles,
        shortcut: ["I"],
      },
      {
        title: "Settings",
        icon: IconSettings,
        items: [
          {
            title: "Programs",
            icon: IconApps,
            url: pricingRoutes.settings.programs(),
            requiredPermission: "org:manage_programs",
          },
          {
            title: "Integrations",
            icon: IconPlug,
            url: pricingRoutes.settings.integrations(),
          },
          {
            title: "Company",
            icon: IconUser,
            url: pricingRoutes.settings.company(),
            // Visible only to broker role
            allowOrgRoles: ["org:broker", "broker"],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Flattens the navigation config into a single array of searchable items
 */
export function flattenNavigation(items: NavItem[] = NAVIGATION_CONFIG): NavItem[] {
  return items.reduce((acc, item) => {
    if (item.url) {
      acc.push(item);
    }
    if (item.items) {
      acc.push(...flattenNavigation(item.items));
    }
    return acc;
  }, [] as NavItem[]);
}

export function getBreadcrumbSegments(pathname: string): { label: string; href?: string }[] {
  // Simple heuristic for now - split path and capitalize
  // In a real app, you might want to map paths to labels using the config
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    return {
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href,
    };
  });
}

/**
 * Check if a navigation item is currently active based on the current path.
 * Re-exported from @repo/lib/routes for convenience.
 */
export { isActivePath };

/**
 * Check if a navigation item should be highlighted as active.
 * Handles both exact matches and child route matches.
 *
 * @param currentPath - The current browser path
 * @param navItem - The navigation item to check
 * @returns Whether the nav item should be shown as active
 */
export function isNavItemActive(currentPath: string, navItem: NavItem): boolean {
  if (!navItem.url) return false;
  return isActivePath(currentPath, navItem.url);
}
