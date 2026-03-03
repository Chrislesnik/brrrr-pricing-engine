"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { RouteProtection } from "@/components/auth/route-protection"
import { Button } from "@repo/ui/shadcn/button"
import { LoanApplicationForm } from "../components/loan-application-form"

function NewApplicationContent() {
  const router = useRouter()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/applications")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-bold tracking-tight">
            New Loan Application
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <LoanApplicationForm className="h-full rounded-lg border" />
      </div>
    </div>
  )
}

export default function NewApplicationPage() {
  return (
    <RouteProtection>
      <NewApplicationContent />
    </RouteProtection>
  )
}
