import { BookOpen, FileText, Code, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const RESOURCES_NAV_ITEMS: NavItem[] = [
  { title: "Underwriting Guidelines", href: "/resources/guidelines", icon: BookOpen },
  { title: "Document Templates", href: "/resources/templates", icon: FileText },
  { title: "Help Guides", href: "/resources/help", icon: Code },
  { title: "All Resources", href: "/resources", icon: FileText },
];
