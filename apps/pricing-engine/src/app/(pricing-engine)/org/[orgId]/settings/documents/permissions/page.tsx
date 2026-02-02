import Link from "next/link";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/shadcn/alert";
import { getDocumentRbacMatrix } from "./actions";
import RbacMatrixClient from "@/components/rbac-matrix-client";

export default async function PermissionsPage({
  params,
}: {
  params: { orgId: string };
}) {
  const orgId = params.orgId;
  
  // Fetch data on the server with error handling
  let matrixData;
  let error: string | null = null;
  
  try {
    matrixData = await getDocumentRbacMatrix();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load permissions data";
    console.error("Error loading RBAC matrix:", e);
  }

  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-6xl">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href={`/org/${orgId}/settings`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold">Document Permissions</h1>
          <p className="mt-1 text-muted-foreground">
            Control which roles can access different document types
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4" />
              Permission Types
            </CardTitle>
            <CardDescription>
              Understanding document permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>View:</strong> Can see and download documents
              </div>
              <div>
                <strong>Insert:</strong> Can create new document records
              </div>
              <div>
                <strong>Upload:</strong> Can upload document files
              </div>
              <div>
                <strong>Delete:</strong> Can remove documents
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to Load Permissions</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{error}</p>
              {error.includes("template") && (
                <p className="text-sm">
                  Please ensure the Supabase JWT template is configured in your Clerk dashboard.
                  Visit{" "}
                  <a
                    href="https://dashboard.clerk.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Clerk Dashboard
                  </a>{" "}
                  → JWT Templates → Configure Supabase template.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* RBAC Matrix - Client Component */}
        {matrixData && !error && <RbacMatrixClient initial={matrixData} />}
      </div>
    </div>
  );
}
