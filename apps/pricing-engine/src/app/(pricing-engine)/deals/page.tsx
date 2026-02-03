"use client"

import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/shadcn/breadcrumb"
import { ContentSection } from "@/components/content-section"

export default function DealsPipelinePage() {
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
              <BreadcrumbPage>Deals Pipeline</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Deals Pipeline
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ContentSection
          title="Deals Pipeline"
          desc="Manage your deals here."
        >
          <div className="p-4 text-muted-foreground">
            Deals pipeline content coming soon.
          </div>
        </ContentSection>
      </div>
    </>
  )
}
