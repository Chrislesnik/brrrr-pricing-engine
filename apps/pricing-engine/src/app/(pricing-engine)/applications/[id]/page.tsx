"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { RouteProtection } from "@/components/auth/route-protection"
import { Button } from "@repo/ui/shadcn/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/shadcn/breadcrumb"
import MultiStepForm from "@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm"

interface ApplicationData {
  id: string
  entityId: string | null
  entityName: string | null
  propertyAddress: string | null
  guarantors: Array<{ id: string; name: string; email: string | null }>
}

function ApplicationWorkflowContent() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplication() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/applications/${applicationId}`)

        if (!response.ok) {
          throw new Error("Failed to load application")
        }

        const data = await response.json()
        setApplication(data)
      } catch (err) {
        console.error("Error fetching application:", err)
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        )
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading application...
          </p>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/applications")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="border-destructive/50 bg-destructive/10 max-w-md rounded-md border p-6">
            <h3 className="text-destructive mb-2 font-semibold">
              Unable to load application
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {error || "Application not found"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/applications")}
            >
              Back to Applications
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle =
    application.entityName || application.propertyAddress || "Application"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/applications">Applications</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/applications")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-bold tracking-tight">{pageTitle}</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MultiStepForm
          className="h-full rounded-lg border"
          applicationId={applicationId}
          entityId={application.entityId}
          entityName={application.entityName}
          guarantors={application.guarantors ?? undefined}
        />
      </div>
    </div>
  )
}

export default function ApplicationWorkflowPage() {
  return (
    <RouteProtection>
      <ApplicationWorkflowContent />
    </RouteProtection>
  )
}
