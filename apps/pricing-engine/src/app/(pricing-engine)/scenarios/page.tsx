"use client"

import { useEffect, useMemo, useRef } from "react"
import useSWR from "swr"
import { PipelineTable } from "./components/pipeline-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import type { LoanRow } from "./data/fetch-loans"
import type { StarredInput, AddressInput, ColumnRoleInput } from "./components/pipeline-columns"

interface PipelineResponse {
  items: LoanRow[]
  starredInputs: StarredInput[]
  addressInputs: AddressInput[]
  columnRoleInputs: ColumnRoleInput[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const REALTIME_TABLES = ["loans", "loan_scenarios", "loan_scenario_inputs"] as const

export default function PipelinePage() {
  const { data, isLoading, mutate } = useSWR<PipelineResponse>("/api/pipeline", fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 0,
  })
  const loans = data?.items ?? []
  const starredInputs = data?.starredInputs ?? []
  const addressInputs = data?.addressInputs ?? []
  const columnRoleInputs = data?.columnRoleInputs ?? []

  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const revalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => void mutate(), 300)
    }

    const channel = supabase.channel("scenarios-realtime")

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        revalidate,
      )
    }

    channel.subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [supabase, mutate])

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
        columnRoleInputs={columnRoleInputs}
      />
    </div>
  )
}
