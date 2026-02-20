"use client"

export default function ThirdPartyIndividualsPage() {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            3rd Party Individuals
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground">
          Third party individual contacts will be displayed here.
        </div>
      </div>
    </>
  )
}
