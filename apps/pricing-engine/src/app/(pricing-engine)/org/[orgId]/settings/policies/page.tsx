import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/shadcn/alert";
import { getOrgPolicies, getOrgDisplayName } from "./actions";
import OrgPolicyBuilder from "@/components/policies/org-policy-builder";

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  let policiesData;
  let error: string | null = null;
  let orgDisplayName = "This Organization";

  try {
    policiesData = await getOrgPolicies();
    orgDisplayName = await getOrgDisplayName().catch(() => "This Organization");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load policies";
    console.error("Error loading org policies:", e);
  }

  return (
    <div className="w-full min-h-full flex justify-center px-6 py-6 md:px-8 md:py-8">
      <div className="w-full max-w-6xl space-y-8">
        <div>
          <Link
            href={`/org/${orgId}/settings`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold">Access Policies</h1>
          <p className="mt-1 text-muted-foreground">
            Create conditional rules to customize user access and org-scoped permissions.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to Load Policies</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {policiesData && !error && (
          <OrgPolicyBuilder
            initialPolicies={policiesData.policies}
            orgDisplayName={orgDisplayName}
          />
        )}
      </div>
    </div>
  );
}
