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
import { IconApps, IconSettings, IconUsers, IconUser, IconSparkles, IconPlug, IconBuilding, IconListTree, IconFile, IconCircleNumber1, IconLayoutSidebarRightFilled, IconBriefcase } from "@tabler/icons-react";

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
  dashboard: "/",
  pricingEngine: {
    pipeline: "/scenarios",
    deals: "/deals",
    new: "/pricing/new",
    pricing: "/pricing",
  },
  applications: "/applications",
  contacts: {
    applicants: {
      borrowers: "/contacts/borrowers",
      entities: "/contacts/entities",
    },
    brokers: "/contacts/brokers",
    users: "/users",
  },
  aiAgent: "/ai-agent",
  docs: "/docs",
  resources: "/resources",
  settings: {
    programs: "/settings",
    integrations: "/settings/integrations",
    company: "/settings/company",
  },
} as const;

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    title: "Pricing Engine",
    items: [
      {
        title: "Scenarios",
        url: ROUTES.pricingEngine.pipeline,
        icon: IconListTree,
        shortcut: ["S"],
      },
    ],
  },
  {
    title: "Pipeline",
    items: [
      // Pipeline (no url, now has nested "Loan Setup")
      {
        title: "Deals",
        url: ROUTES.pricingEngine.deals,
        icon: IconBriefcase,
        shortcut: ["D"],
        items: [
          {
            title: "Loan Setup",
            icon: IconCircleNumber1,
            items: [
            {
              title: "Applications",
              url: ROUTES.applications,
              icon: IconFile,
              shortcut: ["A"],
            },
          ],
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
            url: ROUTES.contacts.applicants.borrowers,
            // Icon removed for nested sub-items
            shortcut: ["B"],
          },
          {
            title: "Entities",
            url: ROUTES.contacts.applicants.entities,
            // Icon removed for nested sub-items
            shortcut: ["E"],
          },
        ],
      },
      {
        title: "Brokers",
        url: ROUTES.contacts.brokers,
        icon: IconUser,
        denyOrgRoles: ["org:broker", "broker"],
        shortcut: ["K"],
      },
    ],
  },
  {
   title: "Tools",
   items: [
     {
       title: "AI Agent",
       url: ROUTES.aiAgent,
       icon: IconSparkles,
       shortcut: ["AI"],
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
    let label =
      navItem?.title ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    // Override Settings label for nested settings routes
    if (segment === "settings" && segments.length > 1) {
      label = "Settings";
    }
    
    return { label, href };
  });
}
