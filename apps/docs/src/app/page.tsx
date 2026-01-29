export default function DocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">Developer Documentation</h1>
      <p className="text-muted-foreground">
        This app will be integrated with BaseHub for managing API documentation,
        webhook guides, and technical integration guides.
      </p>
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Fork the BaseHub documentation template</li>
          <li>Create a new BaseHub repo for Developer Documentation</li>
          <li>Deploy to Vercel</li>
          <li>Add BASEHUB_TOKEN to .env.local</li>
          <li>Integrate BaseHub Pump component for real-time content</li>
        </ol>
      </div>
    </div>
  );
}
