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
import { getOrgPolicies } from "./actions";
import OrgPolicyBuilder from "@/components/policies/org-policy-builder";

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  let policiesData;
  let error: string | null = null;

  try {
    policiesData = await getOrgPolicies();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load policies";
    console.error("Error loading org policies:", e);
  }

  return (
    <div className="w-full min-h-full flex justify-center p-6 md:p-8">
      <div className="w-full max-w-6xl space-y-8 pb-20">
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
            Define global policies for tables and storage buckets.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" />
              v1 Scope (Global)
            </CardTitle>
            <CardDescription>
              Policies apply to all tables or all buckets using resource_name = "*".
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            v2 will introduce row-level filters and UI field visibility. For now,
            use rules that combine org role and member role conditions.
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to Load Policies</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {policiesData && !error && (
          <OrgPolicyBuilder initialPolicies={policiesData.policies} />
        )}
      </div>
    </div>
  );
}
