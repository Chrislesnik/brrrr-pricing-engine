"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-[7rem] leading-tight font-bold">500</h1>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="max-w-md text-center text-muted-foreground">
              An unexpected error occurred. This has been logged and our team
              will look into it.
            </p>
          </div>

          {error.message && (
            <details className="mt-2 max-w-lg rounded-md border bg-muted/50 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">
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

          <div className="mt-4 flex gap-3">
            <button
              onClick={reset}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent"
            >
              Back to Home
            </a>
          </div>

          <div className="mt-6 max-w-sm text-center text-sm text-muted-foreground">
            <p className="font-medium">Suggestions:</p>
            <ul className="mt-1 list-inside list-disc text-left">
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  )
}
