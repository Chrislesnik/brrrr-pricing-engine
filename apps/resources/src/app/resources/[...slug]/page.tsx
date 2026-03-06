import { basehub } from "basehub";
import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "basehub/react-rich-text";
import Link from "next/link";
import {
  ChevronRight,
  Tag,
  ArrowLeft,
} from "lucide-react";

function sanitizeRichTextContent(content: any[]): any[] {
  return content
    .filter(
      (node): node is Record<string, unknown> =>
        node != null && typeof node === "object" && "type" in node
    )
    .map((node) => {
      if (Array.isArray(node.content)) {
        return { ...node, content: sanitizeRichTextContent(node.content) };
      }
      return node;
    });
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const { isEnabled } = await draftMode();

  if (!slug || slug.length === 0) {
    notFound();
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
                _sys_slug: { eq: slugPath },
              },
              first: 1,
            },
            items: {
              _id: true,
              _slug: true,
              _title: true,
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
      {async ([{ documentation }]) => {
        "use server";

        const item = documentation?.items?.[0];
        if (!item) return notFound();

        const toc = item.richText?.json?.toc;

        return (
          <div className="flex">
            {/* Main content */}
            <div className="flex-1 overflow-hidden">
              <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
                {/* Breadcrumb */}
                <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
                  <Link
                    href="/resources"
                    className="transition-colors hover:text-foreground"
                  >
                    Resources
                  </Link>
                  {item.category && item.category !== "Root" && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="transition-colors hover:text-foreground">
                        {item.category}
                      </span>
                    </>
                  )}
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate font-medium text-foreground">
                    {item._title}
                  </span>
                </nav>

                {/* Header */}
                <header className="mb-8 border-b pb-8">
                  {item.category && item.category !== "Root" && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {item.category}
                    </div>
                  )}
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {item._title}
                  </h1>
                </header>

                {/* Content */}
                <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-10 prose-h3:text-xl prose-h3:mt-8 prose-p:leading-7 prose-li:leading-7 prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:border">
                  {(() => {
                    const raw = item.richText?.json?.content;
                    const safe = Array.isArray(raw)
                      ? sanitizeRichTextContent(raw)
                      : null;
                    return safe && safe.length > 0 ? (
                      <RichText>{safe}</RichText>
                    ) : (
                      <div className="rounded-lg border bg-muted/30 p-8 text-center">
                        <p className="text-muted-foreground">
                          No content available for this resource yet.
                        </p>
                      </div>
                    );
                  })()}
                </article>

                {/* Back link */}
                <div className="mt-12 border-t pt-6">
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Resources
                  </Link>
                </div>
              </div>
            </div>

            {/* Table of Contents sidebar */}
            {toc && toc.length > 0 && (
              <aside className="hidden w-56 shrink-0 xl:block">
                <div className="sticky top-20 py-8 pr-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    On this page
                  </h4>
                  <nav className="space-y-1">
                    {toc.map((entry: { id: string; title: string; depth: number }, i: number) => (
                      <a
                        key={i}
                        href={`#${entry.id}`}
                        className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                        style={{
                          paddingLeft: `${(entry.depth - 1) * 12}px`,
                        }}
                      >
                        {entry.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        );
      }}
    </Pump>
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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return { title: "Resources" };
  }

  const slugPath = slug.join("/");

  const data = await basehub().query({
    documentation: {
      __args: {
        filter: {
          _sys_slug: { eq: slugPath },
        },
        first: 1,
      },
      items: {
        _title: true,
        category: true,
      },
    },
  });

  const item = data.documentation.items[0];

  return {
    title: item?._title || "Resources",
    description: `${item?._title || "Resource"} - ${item?.category || "Documentation"}`,
  };
}
