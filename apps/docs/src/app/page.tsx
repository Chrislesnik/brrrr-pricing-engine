import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import Link from "next/link";
import { ArrowRight, Book, Code, Webhook } from "lucide-react";
import { HomeLayoutWrapper } from "@/components/home-layout-wrapper";

export default async function DocsHomePage() {
  return (
    <HomeLayoutWrapper>
      <DocsHomePageContent />
    </HomeLayoutWrapper>
  );
}

async function DocsHomePageContent() {
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
            __args: {
              first: 10,
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

        return <DocsHomeContent data={data} />;
      }}
    </Pump>
  );
}


function DocsHomeContent({ data }: { data: any }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <h1 className="text-5xl font-bold mb-4">
            Developer Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            API documentation, webhook guides, and technical integration resources for the BRRRR Pricing Engine platform.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="rounded-lg border bg-card p-6">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">API Reference</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete API documentation with endpoints, parameters, and response examples.
            </p>
            <Link
              href="/docs/api"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center"
            >
              View API Docs
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Webhook className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Webhooks</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set up real-time event notifications for your integrations.
            </p>
            <Link
              href="/docs/webhooks"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center"
            >
              Webhook Guide
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Guides</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Step-by-step tutorials and integration guides.
            </p>
            <Link
              href="/docs/guides"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center"
            >
              Read Guides
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* BaseHub Connection Status */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">BaseHub Connection</h2>
          {data?._sys ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-success/10 p-4 border border-success/20">
                <p className="text-sm font-medium text-success-foreground">
                  ✅ Connected to BaseHub
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Repo: {data._sys.title} (ID: {data._sys.id})
                </p>
              </div>
              
              {data.documentation.items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Recent Documentation</h3>
                  <div className="space-y-2">
                    {data.documentation.items.slice(0, 5).map((item: any) => (
                      <Link
                        key={item._id}
                        href={`/docs/${item._slug}`}
                        className="block p-3 rounded-md border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{item._title}</p>
                            {item.category && (
                              <span className="text-xs text-muted-foreground">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-warning/10 p-4 border border-warning/20">
              <p className="text-sm font-medium text-warning-foreground">
                Connecting to BaseHub...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
