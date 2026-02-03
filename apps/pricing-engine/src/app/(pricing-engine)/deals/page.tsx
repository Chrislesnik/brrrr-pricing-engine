"use client"

export default function DealsPipelinePage() {
  return (
    <div className="space-y-6 w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Deals</h1>
            <p className="text-muted-foreground text-sm">
              Track and manage your deals
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 text-muted-foreground">
          Deals pipeline content coming soon.
        </div>
      </div>
    </div>
  )
}
