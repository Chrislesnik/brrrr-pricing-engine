"use client"

import useSWR from "swr"
import { ApplicationsTable } from "./components/applications-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { ApplicationRow } from "./data/fetch-applications"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ApplicationsPage() {
  const { data, isLoading } = useSWR<{ items: ApplicationRow[] }>("/api/applications/list", fetcher)
  const applications = data?.items ?? []

  // Show skeleton ONLY during initial load (no data yet), not during revalidation
  // This prevents the table from unmounting and losing pagination state
  if (isLoading && !data) {
    return <PageSkeleton title="Applications" columns={6} rows={10} />
  }

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Manage loan applications and track signing progress.
        </p>
      </div>
      <ApplicationsTable data={applications} />
    </div>
  )
}
