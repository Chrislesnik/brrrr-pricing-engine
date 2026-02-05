"use client"

import dynamic from "next/dynamic"

// Dynamic import to prevent hydration mismatch with Radix UI generated IDs
const AppSidebar = dynamic(
  () => import("@/components/layout/app-sidebar").then((mod) => mod.AppSidebar),
  { ssr: false }
)

export function AppSidebarWrapper() {
  return <AppSidebar />
}
