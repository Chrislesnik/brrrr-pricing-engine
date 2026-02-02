import {
  Building,
  Home,
  FileBarChart2,
  ArrowLeftRight,
  FileSpreadsheet,
  CreditCard,
  FileSignature,
  ArrowDownLeft,
  ArrowUpRight,
  ListTree,
  PieChart,
  BarChart3,
  Users,
  Settings,
  Plug,
  Sparkles,
  Inbox,
  User,
  type LucideIcon,
} from "lucide-react";
import { IconApps, IconSettings, IconUsers, IconUser, IconSparkles, IconInbox, IconPlug, IconBuilding } from "@tabler/icons-react";

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
// ROUTE CONSTANTS
// ============================================================================

export const ROUTES = {
  dashboard: "/dashboard",
  pipeline: "/pipeline",
  applications: "/applications",
  applicants: {
    borrowers: "/applicants/borrowers",
    entities: "/applicants/entities",
  },
  brokers: "/brokers",
  aiAgent: "/ai-agent",
  settings: {
    programs: "/settings/programs",
    integrations: "/settings/integrations",
    company: "/settings/company",
  },
  docs: "/docs",
  resources: "/resources",
} as const;

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    title: "Pricing Engine",
    items: [
      {
        title: "Pipeline",
        url: ROUTES.pipeline,
        icon: IconUsers,
        shortcut: ["P"],
      },
      {
        title: "Loan Setup",
        icon: IconApps,
        items: [
          {
            title: "Applications",
            url: ROUTES.applications,
            icon: IconInbox,
            shortcut: ["A"],
          },
        ],
      },
    ],
  },
  {
    title: "Contacts",
    items: [
      {
        title: "Applicants",
        icon: IconUsers,
        items: [
          {
            title: "Borrowers",
            url: ROUTES.applicants.borrowers,
            icon: IconUser,
            shortcut: ["B"],
          },
          {
            title: "Entities",
            url: ROUTES.applicants.entities,
            icon: IconBuilding,
            shortcut: ["E"],
          },
        ],
      },
      {
        title: "Brokers",
        url: ROUTES.brokers,
        icon: IconUser,
        denyOrgRoles: ["org:broker", "broker"],
        shortcut: ["K"],
      },
    ],
  },
  {
    title: "AI Agent",
    items: [
      {
        title: "AI Agent",
        url: ROUTES.aiAgent,
        icon: IconSparkles,
        shortcut: ["I"],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Programs",
        icon: IconApps,
        url: ROUTES.settings.programs,
        requiredPermission: "org:manage_programs",
      },
      {
        title: "Integrations",
        icon: IconPlug,
        url: ROUTES.settings.integrations,
      },
      {
        title: "Company",
        icon: IconUser,
        url: ROUTES.settings.company,
        // Visible only to broker role
        allowOrgRoles: ["org:broker", "broker"],
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

/**
 * Finds a navigation item by its URL path
 */
function findNavItemByUrl(url: string, items: NavItem[]): NavItem | null {
  for (const item of items) {
    if (item.url === url) return item;
    if (item.items) {
      const found = findNavItemByUrl(url, item.items);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Generates breadcrumb segments from pathname using navigation config for labels
 */
export function getBreadcrumbSegments(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  
  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    
    // Try to find matching nav item for accurate label
    const navItem = findNavItemByUrl(href, NAVIGATION_CONFIG);
    
    // Use nav item title if found, otherwise capitalize segment
    const label = navItem?.title || 
                  segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    
    return { label, href };
  });
}
