import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { getDocumentRbacMatrix } from "./actions";
import RbacMatrixClient from "@/components/rbac-matrix-client";

export default async function PermissionsPage({
  params,
}: {
  params: { orgId: string };
}) {
  const orgId = params.orgId;
  
  // Fetch data on the server
  const matrixData = await getDocumentRbacMatrix();

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

        {/* RBAC Matrix - Client Component */}
        <RbacMatrixClient initial={matrixData} />
      </div>
    </div>
  );
}
