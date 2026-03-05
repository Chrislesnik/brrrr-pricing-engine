import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  Search,
  FileText,
  ExternalLink,
} from "lucide-react";
import { HOMEPAGE_CATEGORIES, CATEGORY_CONFIG } from "@/config/navigation";

export default async function ResourcesPage() {
  const { isEnabled } = await draftMode();

  return (
    <Pump
      draft={isEnabled}
      queries={[
        {
          _sys: {
            id: true,
            title: true,
          },
          documentation: {
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

        const items = data.documentation?.items || [];
        const categories: Record<string, typeof items> = {};

        for (const item of items) {
          const cat = item.category || "General";
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(item);
        }

        const totalResources = items.length;

        return (
          <div className="flex flex-col">
            {/* Hero */}
            <div className="border-b bg-gradient-to-b from-muted/40 to-background">
              <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                    <BookOpen className="h-3 w-3" />
                    DSCR Loan Funder Resource Hub
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Everything you need to{" "}
                    <span className="text-primary">close more loans</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    Guidelines, templates, rate sheets, and training materials
                    for our team and lending partners. Find what you need to
                    originate, underwrite, and close with confidence.
                  </p>
                  <div className="mt-8 flex w-full max-w-md items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Search {totalResources} resources...
                    </span>
                    <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-b">
              <div className="mx-auto max-w-5xl px-6 py-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <QuickAction
                    title="Getting Started"
                    description="New here? Start with the basics"
                    href="/resources/getting-started"
                    icon="🚀"
                  />
                  <QuickAction
                    title="Rate Sheets"
                    description="Current pricing & programs"
                    href="/resources/documents?folder=rate-sheets"
                    icon="📊"
                  />
                  <QuickAction
                    title="Submit a Loan"
                    description="Step-by-step submission guide"
                    href="/resources/submission-process"
                    icon="📝"
                  />
                  <QuickAction
                    title="Document Library"
                    description="Download forms & templates"
                    href="/resources/documents"
                    icon="📁"
                  />
                </div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="mx-auto w-full max-w-5xl px-6 py-12">
              <h2 className="mb-1 text-lg font-semibold">
                Browse by Category
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Explore resources organized by topic
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {HOMEPAGE_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const catItems =
                    categories[category.title]?.length || 0;
                  return (
                    <Link
                      key={category.title}
                      href={category.href}
                      className="group relative flex flex-col rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${category.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary">
                            {category.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      {catItems > 0 && (
                        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {catItems}{" "}
                          {catItems === 1 ? "resource" : "resources"}
                        </div>
                      )}
                      <ArrowRight className="absolute right-4 top-6 h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Content by Category */}
            <div className="border-t bg-muted/20">
              <div className="mx-auto w-full max-w-5xl px-6 py-12">
                <h2 className="mb-1 text-lg font-semibold">All Resources</h2>
                <p className="mb-8 text-sm text-muted-foreground">
                  Browse our full library of guides and documentation
                </p>

                <div className="space-y-10">
                  {Object.entries(categories)
                    .sort(([a], [b]) => {
                      const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
                      const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
                      return orderA - orderB;
                    })
                    .map(([category, categoryItems]) => {
                      const config = CATEGORY_CONFIG[category];
                      const Icon =
                        config?.icon || BookOpen;
                      return (
                        <section key={category} id={category.toLowerCase().replace(/\s+/g, "-")}>
                          <div className="mb-4 flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              {config?.label || category}
                            </h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {categoryItems.length}
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {categoryItems.map((item) => (
                              <Link
                                key={item._id}
                                href={`/resources/${item._slug}`}
                                className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:bg-accent/50"
                              >
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                                <span className="text-sm font-medium truncate group-hover:text-primary">
                                  {item._title}
                                </span>
                                <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60" />
                              </Link>
                            ))}
                          </div>
                        </section>
                      );
                    })}
                </div>

                {items.length === 0 && (
                  <div className="rounded-xl border bg-card p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      No resources yet
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Content is managed through BaseHub. Add your first
                      document to get started.
                    </p>
                    <a
                      href="https://basehub.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Open BaseHub Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </Pump>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <span className="mb-2 text-2xl">{icon}</span>
      <span className="text-sm font-semibold group-hover:text-primary">
        {title}
      </span>
      <span className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
        {description}
      </span>
    </Link>
  );
}
