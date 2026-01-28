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
import { ApplicationsTable } from "./components/applications-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { ApplicationRow } from "./data/fetch-applications"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ApplicationsPage() {
  const { data, isLoading } = useSWR<{ items: ApplicationRow[] }>("/api/applications/list", fetcher)
  const applications = data?.items ?? []

  if (isLoading) {
    return <PageSkeleton title="Applications" columns={6} rows={10} />
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
              <BreadcrumbPage>Applications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Applications
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ApplicationsTable data={applications} />
      </div>
    </>
  )
}
