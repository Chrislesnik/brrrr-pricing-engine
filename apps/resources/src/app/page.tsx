import { client } from "@/lib/basehub";

export default async function ResourcesPage() {
  // Query documentation from BaseHub
  // Uncomment and customize once your BaseHub repo is set up
  /*
  const data = await client.query({
    documentation: {
      items: {
        _id: true,
        _title: true,
        _slug: true,
        richText: {
          json: {
            content: true,
          },
        },
      },
    },
  });
  */

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">Lender Resources</h1>
      <p className="text-muted-foreground mb-8">
        Underwriting guidelines, document templates, and help guides for
        lenders.
      </p>

      <div className="rounded-lg border p-6 bg-card">
        <h2 className="text-2xl font-semibold mb-4">BaseHub Integration Ready</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This app is configured to use BaseHub. Complete these steps to enable
          content management:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Fork the BaseHub documentation template:{" "}
            <a
              href="https://github.com/basehub-ai/nextjs-docs-template"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              nextjs-docs-template
            </a>
          </li>
          <li>Create a new BaseHub repo for &quot;Lender Resources&quot;</li>
          <li>Deploy to Vercel</li>
          <li>
            Add <code className="bg-muted px-1 rounded">BASEHUB_TOKEN</code> to{" "}
            <code className="bg-muted px-1 rounded">
              apps/resources/.env.local
            </code>
          </li>
          <li>
            Uncomment the query in <code className="bg-muted px-1 rounded">page.tsx</code>
          </li>
          <li>
            Configure your BaseHub repo structure (guidelines, templates,
            guides)
          </li>
        </ol>

        {/* Uncomment to display BaseHub content
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          {data.documentation.items.map((item) => (
            <div key={item._id} className="mb-6">
              <h3 className="text-lg font-medium">{item._title}</h3>
              <div className="prose dark:prose-invert">
                <!-- Render rich text content -->
              </div>
            </div>
          ))}
        </div>
        */}
      </div>
    </div>
  );
}
