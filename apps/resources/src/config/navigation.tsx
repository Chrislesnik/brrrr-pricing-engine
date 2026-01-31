import { BookOpen, FileText, Code, type LucideIcon } from "lucide-react";
import { resourcesRoutes } from "@repo/lib/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const RESOURCES_NAV_ITEMS: NavItem[] = [
  { title: "Underwriting Guidelines", href: resourcesRoutes.guidelines(), icon: BookOpen },
  { title: "Document Templates", href: resourcesRoutes.templates(), icon: FileText },
  { title: "Help Guides", href: resourcesRoutes.help(), icon: Code },
  { title: "All Resources", href: resourcesRoutes.root(), icon: FileText },
];
