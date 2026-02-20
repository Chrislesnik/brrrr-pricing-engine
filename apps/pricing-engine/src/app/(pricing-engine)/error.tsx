"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconRefresh, IconHome, IconChevronDown } from "@tabler/icons-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  const isNetworkError =
    error.message?.includes("fetch") ||
    error.message?.includes("network") ||
    error.message?.includes("Failed to fetch")

  const isAuthError =
    error.message?.includes("401") ||
    error.message?.includes("Unauthorized") ||
    error.message?.includes("sign in")

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <IconAlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {isAuthError
            ? "Your session may have expired. Please sign in again to continue."
            : isNetworkError
              ? "We couldn\u2019t reach the server. Please check your connection and try again."
              : "An unexpected error occurred while loading this page."}
        </p>
      </div>

      {error.message && (
        <details className="max-w-lg rounded-md border bg-muted/50 px-4 py-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-1 font-medium text-muted-foreground">
            <IconChevronDown className="h-4 w-4" />
            Error details
          </summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs text-destructive">
            {error.message}
          </pre>
          {error.digest && (
            <p className="mt-1 text-xs text-muted-foreground">
              Digest: {error.digest}
            </p>
          )}
        </details>
      )}

      <div className="mt-2 flex gap-3">
        <Button onClick={reset} variant="default" size="sm">
          <IconRefresh className="mr-1.5 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/dashboard">
            <IconHome className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </a>
        </Button>
        {isAuthError && (
          <Button asChild variant="secondary" size="sm">
            <a href="/sign-in">Sign in</a>
          </Button>
        )}
      </div>

      <div className="mt-4 max-w-sm rounded-md border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
        <p className="font-medium">Things to try:</p>
        <ul className="mt-1 list-inside list-disc text-left text-xs">
          {isNetworkError ? (
            <>
              <li>Check your internet connection</li>
              <li>Disable any VPN or proxy</li>
              <li>Wait a moment and try again</li>
            </>
          ) : isAuthError ? (
            <>
              <li>Sign out and sign back in</li>
              <li>Clear your browser cookies</li>
              <li>Contact your admin if access was revoked</li>
            </>
          ) : (
            <>
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Contact support if the problem persists</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
