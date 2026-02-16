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
import { IconApps, IconSettings, IconUsers, IconUser, IconSparkles, IconPlug, IconBuilding, IconListTree, IconFile, IconCircleNumber1, IconLayoutSidebarRightFilled, IconBriefcase, IconFolder, IconFilter, IconSquareRoundedNumber0, IconSquareRoundedNumber1, IconSquareRoundedNumber2, IconSquareRoundedNumber3, IconSquareRoundedNumber4, IconSquareRoundedNumber5, IconSquareRoundedNumber6, IconSquareRoundedNumber7, IconSquareRoundedNumber8, IconSquareRoundedNumber9 } from "@tabler/icons-react";
import { FaUserShield } from "react-icons/fa6";
import { TbHomeSearch } from "react-icons/tb";

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
  tooltip?: string; // Hover tooltip text
}

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

export const ROUTES = {
  dashboard: "/dashboard",
  pricingEngine: {
    pipeline: "/scenarios",
    deals: "/deals",
    new: "/pricing/new",
    pricing: "/pricing",
  },
  applications: "/applications",
  background: "/background",
  credit: "/credit",
  appraisals: "/appraisals",
  contacts: {
    borrowers: {
      individuals: "/contacts/borrowers",
      entities: "/contacts/entities",
      guarantors: "/contacts/guarantors",
      thirdParties: {
        individuals: "/contacts/third-parties/individuals",
        companies: "/contacts/third-parties/companies",
      },
    },
    brokers: {
      individuals: "/contacts/brokers/individual",
      organizations: "/contacts/brokers/organizations",
    },
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
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        url: ROUTES.dashboard,
        icon: Home,
        shortcut: ["D"],
      },
    ],
  },
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
      {
        title: "Deals",
        url: ROUTES.pricingEngine.deals,
        icon: IconFilter,
        shortcut: ["D"],
        items: [
          {
            title: "Applications",
            url: ROUTES.applications,
            icon: IconFolder,
            shortcut: ["A"],
          },
          {
            title: "Appraisals",
            url: ROUTES.appraisals,
            icon: TbHomeSearch,
            shortcut: ["P"],
          },
          {
            title: "Background",
            url: ROUTES.background,
            icon: FaUserShield,
            shortcut: ["B"],
          },
          {
            title: "Credit",
            url: ROUTES.credit,
            icon: CreditCard,
            shortcut: ["C"],
          },
        ],
      },
    ],
  },
  {
    title: "Contacts",
    items: [
      {
        title: "Borrowers",
        icon: IconUsers,
        items: [
          {
            title: "Individuals",
            url: ROUTES.contacts.borrowers.individuals,
            shortcut: ["I"],
            tooltip: "Persons vesting title in the name of one or more individuals.",
          },
          {
            title: "Entities",
            url: ROUTES.contacts.borrowers.entities,
            shortcut: ["E"],
            tooltip: "Companies vesting title in the name of one or more entities.",
          },
        ],
      },
      {
        title: "Brokers",
        icon: IconUser,
        denyOrgRoles: ["org:broker", "broker"],
        items: [
          {
            title: "Individuals",
            url: ROUTES.contacts.brokers.individuals,
            shortcut: ["K"],
          },
          {
            title: "Organizations",
            url: ROUTES.contacts.brokers.organizations,
            shortcut: ["O"],
          },
        ],
      },
      {
        title: "3rd Parties",
        icon: IconUser,
        tooltip: "Third party service providers, companies, and company contacts (e.g., title agent, title company)",
        items: [
          {
            title: "Individuals",
            url: ROUTES.contacts.borrowers.thirdParties.individuals,
            shortcut: ["3"],
            tooltip: "Third party individual contacts (e.g., title agent, inspector)",
          },
          {
            title: "Companies",
            url: ROUTES.contacts.borrowers.thirdParties.companies,
            shortcut: ["C"],
            tooltip: "Third party companies (e.g., title company, inspection firm)",
          },
        ],
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_HEX_RE = /^[0-9a-f]{12,}$/i;

/**
 * Generates breadcrumb segments from pathname using navigation config for labels.
 * UUID / long-hex segments are truncated so breadcrumbs stay compact on mobile.
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

    // Truncate UUID-like or long hex segments so they don't overflow
    if (!navItem && (UUID_RE.test(segment) || LONG_HEX_RE.test(segment))) {
      label = segment.slice(0, 8) + "…";
    }

    // Override Settings label for nested settings routes
    if (segment === "settings" && segments.length > 1) {
      label = "Settings";
    }
    
    return { label, href };
  });
}
