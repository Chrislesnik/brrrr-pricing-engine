import { basehub } from "basehub";
import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DocsSlugPage({ params }: PageProps) {
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
    <article className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:px-8 lg:px-12">
      <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
      <p className="text-muted-foreground">
        Browse all available documentation for the BRRRR Pricing Engine API.
      </p>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <div className="not-prose mt-4 space-y-8">
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
      </div>
    </article>
  );
}

function DocsContent({ item }: { item: any }) {
  return (
    <article className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:px-8 lg:px-12">
      <h1 className="text-3xl font-bold tracking-tight">{item._title}</h1>
      {item.category ? (
        <p className="text-muted-foreground -mt-2">{item.category}</p>
      ) : null}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {item.richText?.json?.content ? (
          <div className="mt-2">
            <RichText>{item.richText.json.content}</RichText>
          </div>
        ) : (
          <p className="text-muted-foreground mt-6">
            No content available for this document.
          </p>
        )}
      </div>
    </article>
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
