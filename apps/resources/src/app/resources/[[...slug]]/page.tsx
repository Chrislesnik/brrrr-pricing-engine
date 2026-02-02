import { basehub } from "basehub";
import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "basehub/react-rich-text";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function ResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const { isEnabled } = await draftMode();

  if (!slug || slug.length === 0) {
    // This is the /resources root - let page.tsx handle it
    notFound();
  }

  const slugPath = slug.join("/");

  return (
    <Pump
      draft={isEnabled}
      queries={[
        {
          documentation: {
            items: {
              __args: {
                filter: {
                  _sys_slug: { eq: slugPath },
                },
              },
              _id: true,
              _slug: true,
              _title: true,
              category: true,
              richText: {
                json: {
                  content: true,
                  toc: true,
                  blocks: true,
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

        return (
          <div className="container mx-auto py-8 px-6">
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/resources" className="hover:text-foreground">
                Resources
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{item._title}</span>
            </nav>
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-6">{item._title}</h1>
              {item.category && item.category !== "Root" && (
                <div className="text-sm text-muted-foreground mb-6">
                  Category: {item.category}
                </div>
              )}
              {item.richText?.json?.content && (
                <div className="mt-8">
                  <RichText>{item.richText.json.content}</RichText>
                </div>
              )}
              {!item.richText && (
                <p className="text-muted-foreground">
                  No content available for this resource yet.
                </p>
              )}
            </article>
          </div>
        );
      }}
    </Pump>
  );
}

// Generate static params for all documentation items at build time
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

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return { title: "Resources" };
  }

  const slugPath = slug.join("/");

  const data = await basehub().query({
    documentation: {
      items: {
        __args: {
          filter: {
            _sys_slug: { eq: slugPath },
          },
        },
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
