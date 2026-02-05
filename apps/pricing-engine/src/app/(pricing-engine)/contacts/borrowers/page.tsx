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
} from "@repo/ui/shadcn/breadcrumb"
import { ApplicantsPrimaryActions } from "../components/applicants-primary-actions"
import { BorrowersTable } from "../components/borrowers-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { Borrower } from "../data/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BorrowersPage() {
  const { data, isLoading } = useSWR<{ items: Borrower[] }>("/api/applicants/borrowers/list", fetcher)
  const borrowers = data?.items ?? []

  if (isLoading) {
    return <PageSkeleton title="Borrowers Pipeline" columns={6} rows={10} />
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
              <BreadcrumbLink asChild>
                <Link href="/applicants/borrowers">Applicants</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Borrowers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Borrowers Pipeline
          </h2>
          <ApplicantsPrimaryActions
            label="New Borrower"
            href="/applicants/borrowers/new"
            type="borrower"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <BorrowersTable data={borrowers} />
      </div>
    </>
  )
}
