"use client"

import useSWR from "swr"
import { PipelineTable } from "./components/pipeline-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { LoanRow } from "./data/fetch-loans"
import type { StarredInput, AddressInput } from "./components/pipeline-columns"

interface PipelineResponse {
  items: LoanRow[]
  starredInputs: StarredInput[]
  addressInputs: AddressInput[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PipelinePage() {
  const { data, isLoading } = useSWR<PipelineResponse>("/api/pipeline", fetcher)
  const loans = data?.items ?? []
  const starredInputs = data?.starredInputs ?? []
  const addressInputs = data?.addressInputs ?? []

  if (isLoading && !data) {
    return <PageSkeleton title="Loan Pipeline" columns={7} rows={10} />
  }

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scenarios</h1>
        <p className="text-muted-foreground">
          Manage and compare your loan pricing scenarios.
        </p>
      </div>
      <PipelineTable
        data={loans}
        starredInputs={starredInputs}
        addressInputs={addressInputs}
      />
    </div>
  )
}
