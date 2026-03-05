"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  docs: "Docs",
  "getting-started": "Getting Started",
  "platform-overview": "Platform Overview",
  guides: "Guides",
  deals: "Managing Deals",
  "borrowers-entities": "Borrowers & Entities",
  documents: "Document Storage",
  "power-users": "Features",
  "api-integration": "REST API",
  "sql-data-access": "SQL & Data Access",
  "ai-features": "AI Features",
  rls: "Row-Level Security",
  reference: "Reference",
  "api-reference": "API Reference",
  "database-schema": "Database Schema",
};

function labelFor(segment: string) {
  return (
    SEGMENT_LABELS[segment] ||
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function DocsBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <span className="text-sm font-medium text-foreground">Documentation</span>
    );
  }

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1 min-w-0">
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-foreground truncate">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
