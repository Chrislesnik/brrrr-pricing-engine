import { BookOpen, Code, Webhook, FileText, type LucideIcon } from "lucide-react";
import { docsRoutes } from "@repo/lib/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const DOCS_NAV_ITEMS: NavItem[] = [
  { title: "Getting Started", href: docsRoutes.gettingStarted(), icon: BookOpen },
  { title: "API Reference", href: docsRoutes.api(), icon: Code },
  { title: "Webhooks", href: docsRoutes.webhooks(), icon: Webhook },
  { title: "All Documentation", href: docsRoutes.root(), icon: FileText },
];
