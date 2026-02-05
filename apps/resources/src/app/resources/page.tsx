import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";

export default async function ResourcesPage() {
  return <ResourcesPageContent />;
}

async function ResourcesPageContent() {
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
        },
      ]}
    >
      {async ([data]) => {
        "use server";

        return <ResourcesContent data={data} />;
      }}
    </Pump>
  );
}


function ResourcesContent({ data }: { data: any }) {
  return (
    <div className="container mx-auto py-8 px-6">
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

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">BaseHub Connection</h2>
          {data?._sys ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✅ Connected to BaseHub!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Repo ID: {data._sys.id}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Repo Title: {data._sys.title}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Your BaseHub repo is connected. Now create your content structure:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create collections for guidelines, templates, guides</li>
                  <li>Update the query in page.tsx to match your structure</li>
                  <li>Content will sync in real-time during development</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Connecting to BaseHub...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
