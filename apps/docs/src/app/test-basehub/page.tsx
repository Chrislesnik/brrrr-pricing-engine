import { client } from '@/lib/basehub';

export default async function TestBaseHubPage() {
  let data: any = null;
  let error: any = null;

  try {
    // Query to check what's in your BaseHub repo
    data = await client.query({
      _sys: {
        id: true,
        title: true,
        slug: true,
        dashboardUrl: true,
      },
      // Check if developerDocumentationForBrrrrPricingEngine exists
      developerDocumentationForBrrrrPricingEngine: {
        _id: true,
        _title: true,
        _slug: true,
      },
      // Check documentation collection
      documentation: {
        _meta: {
          totalCount: true,
          filteredCount: true,
        },
        items: {
          _id: true,
          _title: true,
          _slug: true,
          _slugPath: true,
          category: true,
        },
      },
    });
  } catch (e: any) {
    error = e.message || String(e);
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">BaseHub Repository Test</h1>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <pre className="text-sm text-red-700 overflow-auto">{error}</pre>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              ✅ Connected to BaseHub
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-green-900">Repo ID:</dt>
                <dd className="text-green-700">{data._sys.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-green-900">Repo Title:</dt>
                <dd className="text-green-700">{data._sys.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-green-900">Repo Slug:</dt>
                <dd className="text-green-700">{data._sys.slug}</dd>
              </div>
              <div>
                <dt className="font-medium text-green-900">Dashboard URL:</dt>
                <dd>
                  <a
                    href={data._sys.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {data._sys.dashboardUrl}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Documentation Collection
            </h2>
            <p className="text-sm text-blue-700 mb-2">
              Total Items: {data.documentation._meta.totalCount}
            </p>
            
            {data.documentation.items.length > 0 ? (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-blue-900">Documents:</h3>
                <ul className="space-y-2">
                  {data.documentation.items.map((item: any) => (
                    <li
                      key={item._id}
                      className="bg-white rounded p-3 border border-blue-100"
                    >
                      <div className="font-medium">{item._title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Slug: {item._slug}
                      </div>
                      <div className="text-xs text-gray-500">
                        Path: {item._slugPath}
                      </div>
                      {item.category && (
                        <div className="text-xs text-gray-500">
                          Category: {item.category}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-blue-600 italic mt-2">
                No documents found. Add content in your BaseHub dashboard.
              </p>
            )}
          </div>

          {data.developerDocumentationForBrrrrPricingEngine && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">
                Developer Documentation Block
              </h2>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="font-medium text-purple-900">Title:</dt>
                  <dd className="text-purple-700">
                    {data.developerDocumentationForBrrrrPricingEngine._title}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-purple-900">Slug:</dt>
                  <dd className="text-purple-700">
                    {data.developerDocumentationForBrrrrPricingEngine._slug}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Full Response</h2>
            <pre className="text-xs overflow-auto bg-white p-3 rounded border">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </>
      ) : null}
    </div>
  );
}
