"use client"

import useSWR from "swr"
import { UserPrimaryActions } from "@/app/(pricing-engine)/users/components/user-primary-actions"
import { pipelineColumns } from "./components/pipeline-columns"
import { PipelineTable } from "./components/pipeline-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { LoanRow } from "./data/fetch-loans"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PipelinePage() {
  const { data, isLoading } = useSWR<{ items: LoanRow[] }>("/api/pipeline", fetcher)
  const loans = data?.items ?? []

  // Show skeleton ONLY during initial load (no data yet), not during revalidation
  // This prevents the table from unmounting and losing pagination state
  if (isLoading && !data) {
    return <PageSkeleton title="Loan Pipeline" columns={7} rows={10} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Scenarios
          </h2>
          <UserPrimaryActions />
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <PipelineTable data={loans} columns={pipelineColumns} />
      </div>
    </>
  )
}
