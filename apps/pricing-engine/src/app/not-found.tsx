import Link from "next/link"
import { Button } from "@repo/ui/shadcn/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[7rem] leading-tight font-bold">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pricing">Pricing Engine</Link>
        </Button>
      </div>

      <div className="mt-6 max-w-sm rounded-md border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
        <p className="font-medium">Things to try:</p>
        <ul className="mt-1 list-inside list-disc text-left text-xs">
          <li>Check the URL for typos</li>
          <li>Use the navigation sidebar to find your page</li>
          <li>Contact support if you expected this page to exist</li>
        </ul>
      </div>
    </div>
  )
}
