"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { UserPrimaryActions } from "../users/components/user-primary-actions"
import { pipelineColumns } from "./components/pipeline-columns"
import { PipelineTable } from "./components/pipeline-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { LoanRow } from "./data/fetch-loans"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PipelinePage() {
  const { data, isLoading } = useSWR<{ items: LoanRow[] }>("/api/pipeline", fetcher)
  const loans = data?.items ?? []

  if (isLoading) {
    return <PageSkeleton title="Loan Pipeline" columns={7} rows={10} />
  }

  return (
    <>
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
              <BreadcrumbPage>Pipeline</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Loan Pipeline
          </h2>
          <UserPrimaryActions />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <PipelineTable data={loans} columns={pipelineColumns} />
      </div>
    </>
  )
}
