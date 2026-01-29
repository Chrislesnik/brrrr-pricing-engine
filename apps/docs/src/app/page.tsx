import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";

export default async function DocsPage() {
  return (
    <Pump
      draft={draftMode().isEnabled}
      queries={[
        {
          apiDocs: {
            items: {
              _id: true,
              _title: true,
              _slug: true,
            },
          },
        },
      ]}
    >
      {async ([data]) => {
        "use server";

        return <DocsContent data={data} />;
      }}
    </Pump>
  );
}

function DocsContent({ data }: { data: any }) {
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

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">API Documentation</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you add your BASEHUB_TOKEN, content from your BaseHub repo will
            appear here.
          </p>
          {data?.apiDocs?.items && data.apiDocs.items.length > 0 ? (
            <div className="space-y-6">
              {data.apiDocs.items.map((item: any) => (
                <div key={item._id} className="border-b pb-4">
                  <h3 className="text-lg font-medium">{item._title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Slug: {item._slug}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No content yet. Add your BASEHUB_TOKEN and create content in your
              BaseHub repo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
