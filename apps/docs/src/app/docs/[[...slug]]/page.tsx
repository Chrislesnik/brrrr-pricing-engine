import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { type ReactNode, type ReactElement, isValidElement } from "react";
import { cn } from "@repo/lib/cn";
import { source } from "@/lib/source";
import { getMDXComponents } from "../../../../mdx-components";
import { PageShell } from "@/components/docs/page-shell";
import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  LayoutDashboard,
  Rocket,
  Shield,
} from "lucide-react";

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return extractText(el.props.children);
  }
  return "";
}

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

const quickLinks = [
  {
    title: "Getting Started",
    description:
      "Set up your organization, create your first deal, and configure pricing.",
    href: "/docs/getting-started",
    icon: Rocket,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Platform Overview",
    description:
      "Understand the core concepts and architecture of the platform.",
    href: "/docs/platform-overview",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "User Guides",
    description:
      "Step-by-step guides for managing deals, borrowers, and documents.",
    href: "/docs/guides/deals",
    icon: BookOpen,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "RLS & Permissions",
    description:
      "Row-Level Security policies, client configuration, and data isolation.",
    href: "/docs/power-users/row-level-security",
    icon: Shield,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "API Reference",
    description:
      "Interactive API documentation with request/response examples.",
    href: "/docs/api-reference",
    icon: Code,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Database Schema",
    description:
      "Entity relationships, table definitions, and data dictionary.",
    href: "/docs/reference/database-schema",
    icon: Database,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

export default async function DocsSlugPage({ params }: PageProps) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return <DocsIndexPage />;
  }

  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const toc = page.data.toc.map((item) => ({
    id: item.url.slice(1),
    title: extractText(item.title),
    level: item.depth,
  }));

  return (
    <PageShell
      title={page.data.title}
      description={page.data.description}
      toc={toc}
    >
      <div className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none">
        <MDX components={getMDXComponents()} />
      </div>
    </PageShell>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  if (slug.length === 0) {
    return {
      title: "Documentation",
      description:
        "Everything you need to build, configure, and scale your lending operations.",
    };
  }
  const page = source.getPage(slug);
  if (!page) return {};
  return {
    title: page.data.title,
    description: page.data.description,
  };
}

function DocsIndexPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background px-4 py-16 md:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            dscr.ai Documentation
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, configure, and scale your lending
            operations.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/api-reference"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              API Reference
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-1 text-lg font-semibold">Browse by Topic</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Jump into the section most relevant to you
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                        link.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", link.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
