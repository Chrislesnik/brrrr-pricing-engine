import {
  BookOpen,
  Code,
  Database,
  FileText,
  LayoutDashboard,
  Rocket,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const DOCS_NAV_ITEMS: NavItem[] = [
  { title: "Getting Started", href: "/docs/getting-started", icon: Rocket },
  { title: "Platform Overview", href: "/docs/platform-overview", icon: LayoutDashboard },
  { title: "User Guides", href: "/docs/guides/deals", icon: BookOpen },
  { title: "API Reference", href: "/docs/api-reference", icon: Code },
  { title: "Database Schema", href: "/docs/reference/database-schema", icon: Database },
  { title: "Power Users", href: "/docs/power-users/api-integration", icon: Terminal },
  { title: "All Documentation", href: "/docs", icon: FileText },
];
