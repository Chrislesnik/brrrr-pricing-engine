"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import type { UserPermissions, ContactType, UserRole } from "@/types/auth"
import { useUserPermissions as useUserPermissionsHook } from "@/hooks/use-user-permissions"
import { AlertCircle, Lock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface RouteProtectionProps {
  children: React.ReactNode
  requiredContactTypes?: ContactType[]
  requiredRoles?: UserRole[]
  requiredPermissions?: Array<keyof UserPermissions>
  /** Check DB-level org policy for this resource (calls /api/policies/check) */
  requiredResource?: {
    resourceType: "table" | "storage_bucket"
    resourceName: string
    action: "select" | "insert" | "update" | "delete"
  }
  fallbackComponent?: React.ComponentType<{
    permissions: UserPermissions | null
  }>
  redirectTo?: string
}

/**
 * Check a DB-level org policy via the /api/policies/check endpoint.
 * Returns true if the policy allows the action for the current user.
 */
async function checkDbPolicy(resource: {
  resourceType: string
  resourceName: string
  action: string
}): Promise<boolean> {
  try {
    const res = await fetch("/api/policies/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!data.allowed
  } catch {
    console.error("Failed to check DB policy")
    return false
  }
}

export function RouteProtection({
  children,
  requiredContactTypes = [],
  requiredRoles = [],
  requiredPermissions = [],
  requiredResource,
  fallbackComponent: FallbackComponent,
  redirectTo,
}: RouteProtectionProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const { isLoaded, isSignedIn } = useUser()
  const {
    permissions,
    loading: permissionsLoading,
    error,
  } = useUserPermissionsHook()
  const router = useRouter()

  const checkPermissions = useCallback(async () => {
    if (!isLoaded) return

    if (!isSignedIn) {
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push("/sign-in")
      }
      return
    }

    if (!permissions && !permissionsLoading && !error) {
      setHasAccess(false)
      return
    }

    if (permissions) {
      // Client-side checks (Clerk publicMetadata)
      const contactTypeMatch =
        requiredContactTypes.length === 0 ||
        requiredContactTypes.includes(permissions.contactType)

      const roleMatch =
        requiredRoles.length === 0 || requiredRoles.includes(permissions.role)

      const permissionMatch =
        requiredPermissions.length === 0 ||
        requiredPermissions.every((perm) => permissions[perm])

      const clientAllowed = contactTypeMatch && roleMatch && permissionMatch

      if (!clientAllowed) {
        setHasAccess(false)
        return
      }

      // DB-level policy check (if requiredResource is specified)
      if (requiredResource) {
        const dbAllowed = await checkDbPolicy(requiredResource)
        setHasAccess(dbAllowed)
      } else {
        setHasAccess(true)
      }
    } else {
      setHasAccess(false)
    }
  }, [
    isLoaded,
    isSignedIn,
    permissions,
    permissionsLoading,
    error,
    requiredContactTypes,
    requiredRoles,
    requiredPermissions,
    requiredResource,
    router,
    redirectTo,
  ])

  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  if (!isLoaded || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    if (FallbackComponent) {
      return <FallbackComponent permissions={permissions} />
    }

    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Your Current Access Level</AlertTitle>
                <AlertDescription>
                  Contact Type: {permissions.contactType}
                  <br />
                  Role: {permissions.role}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook to get current user permissions
 * @deprecated Use the hook from @/hooks/use-user-permissions instead
 */
export function useUserPermissions() {
  return useUserPermissionsHook()
}
