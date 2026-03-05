import { basehub } from "basehub";
import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@repo/lib/cn";
import { ActiveToc } from "@/components/docs/active-toc";
import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  FileText,
  LayoutDashboard,
  Rocket,
  Shield,
  Terminal,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

interface TocEntry {
  title: string;
  id: string;
  level: number;
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
    href: "/docs/power-users/rls",
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

function TableOfContents({ toc }: { toc: TocEntry[] }) {
  if (!toc || toc.length === 0) return null;
  return <ActiveToc toc={toc} />;
}

export default async function DocsSlugPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const { isEnabled } = await draftMode();

  if (slug.length === 0) {
    return <DocsIndexPage />;
  }

  const slugPath = slug.join("/");

  return (
    <Pump
      draft={isEnabled}
      queries={[
        {
          documentation: {
            __args: {
              filter: {
                _sys_slug: {
                  eq: slugPath,
                },
              },
              first: 1,
            },
            items: {
              _id: true,
              _title: true,
              _slug: true,
              _sys: {
                slug: true,
              },
              category: true,
              richText: {
                json: {
                  content: true,
                  toc: true,
                },
              },
            },
          },
        },
      ]}
    >
      {async ([data]) => {
        "use server";

        const item = data.documentation.items[0];

        if (!item) {
          notFound();
        }

        return <DocsContent item={item} />;
      }}
    </Pump>
  );
}

async function DocsIndexPage() {
  const { isEnabled } = await draftMode();

  return (
    <Pump
      draft={isEnabled}
      queries={[
        {
          documentation: {
            __args: {
              orderBy: "_sys_title__ASC",
            },
            items: {
              _id: true,
              _title: true,
              _slug: true,
              category: true,
            },
          },
        },
      ]}
    >
      {async ([data]) => {
        "use server";

        return <DocsIndexContent data={data} />;
      }}
    </Pump>
  );
}

function DocsIndexContent({ data }: { data: any }) {
  const groupedDocs = data.documentation.items.reduce(
    (acc: any, item: any) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hero */}
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

      {/* Quick Links */}
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

      {/* BaseHub Content */}
      <section className="border-t border-border px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight">
            Browse Documentation
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All articles synced from the content repository.
          </p>

          <div className="mt-8 space-y-10">
            {Object.keys(groupedDocs).length > 0 ? (
              Object.entries(groupedDocs).map(
                ([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      {category}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((item: any) => (
                        <Link
                          key={item._id}
                          href={`/docs/${item._slug}`}
                          className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {item._title}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              View article
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <h3 className="text-base font-semibold">
                  No documentation yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Add content to your BaseHub repository to see it here.
                  Documentation will automatically sync and appear in this
                  section.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DocsContent({ item }: { item: any }) {
  const toc: TocEntry[] = item.richText?.json?.toc ?? [];

  return (
    <div className="flex w-full flex-1 gap-10 px-4 py-10 md:px-8 lg:px-12">
      <article className="min-w-0 flex-1 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">{item._title}</h1>
        {item.category ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {item.category}
          </p>
        ) : null}
        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
          {item.richText?.json?.content ? (
            <RichText>{item.richText.json.content}</RichText>
          ) : (
            <p className="text-muted-foreground">
              No content available for this document.
            </p>
          )}
        </div>
      </article>

      {toc.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-20 border-l border-border pl-4">
            <TableOfContents toc={toc} />
          </div>
        </aside>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  const data = await basehub().query({
    documentation: {
      items: {
        _slug: true,
      },
    },
  });

  return data.documentation.items.map((item) => ({
    slug: item._slug.split("/"),
  }));
}
