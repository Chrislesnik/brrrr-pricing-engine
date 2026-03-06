import {
  Home,
  FolderArchive,
  Handshake,
  LifeBuoy,
  FileText,
  GraduationCap,
  BookOpen,
  Shield,
  Calculator,
  Download,
  Scale,
  Users,
  HelpCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  description?: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  external?: boolean;
}

export const STATIC_NAV_SECTIONS: NavSection[] = [
  {
    id: "documents",
    title: "Documents & Forms",
    icon: FolderArchive,
    description: "Downloadable templates, forms, and rate sheets",
    items: [
      {
        title: "Document Library",
        href: "/resources/documents",
        icon: FolderArchive,
        description: "Browse all downloadable files",
      },
      {
        title: "Application Forms",
        href: "/resources/documents?folder=applications",
        icon: FileText,
      },
      {
        title: "Disclosures",
        href: "/resources/documents?folder=disclosures",
        icon: Shield,
      },
      {
        title: "Closing Documents",
        href: "/resources/documents?folder=closing",
        icon: Scale,
      },
      {
        title: "Rate Sheets",
        href: "/resources/documents?folder=rate-sheets",
        icon: Calculator,
      },
    ],
  },
  {
    id: "partners",
    title: "Partner Resources",
    icon: Handshake,
    description: "Tools and guides for brokers and referral partners",
    items: [
      {
        title: "Broker Guide",
        href: "/resources/broker-guide",
        icon: BookOpen,
      },
      {
        title: "Submission Process",
        href: "/resources/submission-process",
        icon: FileText,
      },
      {
        title: "Compensation",
        href: "/resources/compensation",
        icon: Calculator,
      },
      {
        title: "Marketing Materials",
        href: "/resources/documents?folder=marketing",
        icon: Download,
      },
    ],
  },
  {
    id: "help",
    title: "Help & Training",
    icon: LifeBuoy,
    description: "Onboarding, FAQs, and support",
    items: [
      {
        title: "Getting Started",
        href: "/resources/getting-started",
        icon: GraduationCap,
      },
      {
        title: "FAQs",
        href: "/resources/faqs",
        icon: HelpCircle,
      },
      {
        title: "Contact Support",
        href: "/resources/contact",
        icon: Users,
      },
    ],
  },
];

export const QUICK_ACTIONS: NavItem[] = [
  {
    title: "Resource Hub",
    href: "/resources",
    icon: Home,
    description: "Browse all resources",
  },
  {
    title: "What's New",
    href: "/resources/whats-new",
    icon: Sparkles,
    description: "Latest updates and announcements",
  },
];

