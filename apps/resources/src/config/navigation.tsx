import {
  Home,
  Landmark,
  ClipboardCheck,
  FolderArchive,
  Handshake,
  LifeBuoy,
  FileText,
  Building2,
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

export const CATEGORY_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; order: number; description: string }
> = {
  "Loan Programs": {
    icon: Landmark,
    label: "Loan Programs",
    order: 1,
    description: "Product guides, program matrices, and eligibility details",
  },
  Underwriting: {
    icon: ClipboardCheck,
    label: "Underwriting",
    order: 2,
    description: "Guidelines, checklists, and qualification requirements",
  },
  Documentation: {
    icon: BookOpen,
    label: "Documentation",
    order: 3,
    description: "Platform documentation and reference materials",
  },
  "Lender Platform": {
    icon: Building2,
    label: "Platform Guides",
    order: 4,
    description: "How to use the DSCR Loan Funder platform",
  },
};

export const DEFAULT_CATEGORY_ICON = FileText;

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

export const HOMEPAGE_CATEGORIES = [
  {
    title: "Loan Programs",
    description:
      "Explore our product lineup including DSCR, Fix & Flip, Bridge, and Ground Up Construction loans.",
    icon: Landmark,
    href: "/resources#loan-programs",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Underwriting",
    description:
      "Property requirements, borrower qualifications, and documentation checklists.",
    icon: ClipboardCheck,
    href: "/resources#underwriting",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Documents & Forms",
    description:
      "Download application forms, disclosures, rate sheets, and closing documents.",
    icon: FolderArchive,
    href: "/resources/documents",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Partner Resources",
    description:
      "Broker guides, submission workflows, compensation details, and marketing tools.",
    icon: Handshake,
    href: "/resources#partners",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
];
