import { BookOpen, Code, Webhook, FileText, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const DOCS_NAV_ITEMS: NavItem[] = [
  { title: "Getting Started", href: "/docs/getting-started", icon: BookOpen },
  { title: "API Reference", href: "/docs/api", icon: Code },
  { title: "Webhooks", href: "/docs/webhooks", icon: Webhook },
  { title: "All Documentation", href: "/docs", icon: FileText },
];
