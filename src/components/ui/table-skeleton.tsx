"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
  columns?: number
  rows?: number
  showHeader?: boolean
}

export function TableSkeleton({
  columns = 6,
  rows = 8,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => {
                // Generate deterministic width based on row and column index
                // This ensures the same widths are generated on server and client
                const seed = (rowIndex * columns + colIndex) * 7 // Multiply by prime for variation
                const width = 60 + (seed % 40)
                return (
                  <TableCell key={colIndex}>
                    <Skeleton
                      className="h-4"
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface PageSkeletonProps {
  title?: string
  columns?: number
  rows?: number
}

export function PageSkeleton({ title, columns = 6, rows = 8 }: PageSkeletonProps) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <TableSkeleton columns={columns} rows={rows} />
      </div>
    </>
  )
}
