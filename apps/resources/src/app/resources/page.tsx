import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import Link from "next/link";
import { BookOpen, FileText, HelpCircle, ArrowRight } from "lucide-react";

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

        // Group items by category
        const items = data.documentation?.items || [];
        const categories: Record<string, typeof items> = {};

        for (const item of items) {
          const cat = item.category || "General";
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(item);
        }

        return (
          <div className="container mx-auto py-8 px-6">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">Lender Resources</h1>
              <p className="text-lg text-muted-foreground">
                Comprehensive documentation and resources for lenders.
              </p>
            </div>

            {data._sys && (
              <div className="mb-8 rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✅ Connected to BaseHub: {data._sys.title}
                </p>
              </div>
            )}

            <div className="space-y-12">
              {Object.entries(categories).map(([category, categoryItems]) => (
                <section key={category}>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    {category === "Documentation" && <BookOpen className="h-6 w-6" />}
                    {category === "Root" && <FileText className="h-6 w-6" />}
                    {category}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryItems.map((item) => (
                      <Link
                        key={item._id}
                        href={`/resources/${item._slug}`}
                        className="group rounded-lg border p-6 hover:border-primary hover:shadow-md transition-all"
                      >
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                          {item._title}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          <span>Read more</span>
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {items.length === 0 && (
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">Welcome to BaseHub Resources</h3>
                  <p className="text-muted-foreground mb-4">
                    Your BaseHub repository is connected. Create your first document to get started.
                  </p>
                  <a
                    href="https://basehub.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Go to BaseHub Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </Pump>
  );
}
