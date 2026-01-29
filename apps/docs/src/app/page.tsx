import { client } from "@/lib/basehub";

export default async function DocsPage() {
  // Query API documentation from BaseHub
  // Uncomment and customize once your BaseHub repo is set up
  /*
  const data = await client.query({
    apiDocs: {
      items: {
        _id: true,
        _title: true,
        _slug: true,
        content: {
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
      <h1 className="text-4xl font-bold mb-4">Developer Documentation</h1>
      <p className="text-muted-foreground mb-8">
        API documentation, webhook guides, and technical integration guides.
      </p>

      <div className="rounded-lg border p-6 bg-card">
        <h2 className="text-2xl font-semibold mb-4">
          BaseHub Integration Ready
        </h2>
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
          <li>
            Create a new BaseHub repo for &quot;Developer Documentation&quot;
          </li>
          <li>Deploy to Vercel</li>
          <li>
            Add <code className="bg-muted px-1 rounded">BASEHUB_TOKEN</code> to{" "}
            <code className="bg-muted px-1 rounded">apps/docs/.env.local</code>
          </li>
          <li>
            Uncomment the query in{" "}
            <code className="bg-muted px-1 rounded">page.tsx</code>
          </li>
          <li>
            Configure your BaseHub repo structure (API docs, webhooks, guides)
          </li>
        </ol>

        {/* Uncomment to display BaseHub content
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">API Documentation</h2>
          {data.apiDocs.items.map((item) => (
            <div key={item._id} className="mb-6">
              <h3 className="text-lg font-medium">{item._title}</h3>
              <div className="prose dark:prose-invert">
                <!-- Render content -->
              </div>
            </div>
          ))}
        </div>
        */}
      </div>
    </div>
  );
}
