import { basehub } from "basehub";
import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import {
  getRichTextBlocks,
  richTextBlocks,
  richTextComponents,
} from "@/components/docs/basehub-renderers";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DocsPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const { isEnabled } = await draftMode();

  // If no slug, show docs index
  if (slug.length === 0) {
    return <DocsIndexPage />;
  }

  // Convert slug array to path
  const slugPath = slug.join('/');

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
                  blocks: true,
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

// Docs index page when no slug
async function DocsIndexPage() {
  const { isEnabled } = await draftMode();

  return (
    <Pump
      draft={isEnabled}
      queries={[
        {
          documentation: {
            __args: {
              orderBy: '_sys_title__ASC',
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
  const groupedDocs = data.documentation.items.reduce((acc: any, item: any) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <DocsPage>
      <DocsTitle>Documentation</DocsTitle>
      <DocsDescription>
        Browse all available documentation for the BRRRR Pricing Engine API.
      </DocsDescription>
      <DocsBody>
        <div className="not-prose mt-8 space-y-8">
          {Object.keys(groupedDocs).length > 0 ? (
            Object.entries(groupedDocs).map(([category, items]: [string, any]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {category}
                </h2>
                <div className="grid gap-3">
                  {items.map((item: any) => (
                    <Link
                      key={item._id}
                      href={`/docs/${item._slug}`}
                      className="group block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {item._title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            View documentation
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documentation yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add content to your BaseHub repository to see it here. Documentation
                will automatically sync and appear in this section.
              </p>
            </div>
          )}
        </div>
      </DocsBody>
    </DocsPage>
  );
}

function DocsContent({ item }: { item: any }) {
  const blocks = getRichTextBlocks(item.richText?.json?.blocks);

  return (
    <DocsPage>
      <DocsTitle>{item._title}</DocsTitle>
      {item.category ? (
        <DocsDescription>{item.category}</DocsDescription>
      ) : null}
      <DocsBody>
        {item.richText ? (
          <div className="mt-6">
            <RichText
              content={item.richText.json.content}
              blocks={blocks}
              components={{
                ...richTextComponents,
                ...richTextBlocks,
              }}
            />
          </div>
        ) : (
          <p className="text-muted-foreground mt-6">
            No content available for this document.
          </p>
        )}
      </DocsBody>
    </DocsPage>
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
