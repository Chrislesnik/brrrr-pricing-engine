"use client"

import * as React from "react"
import type { DSCRTermSheetProps } from "./DSCRTermSheet"

export default function BridgeTermSheet(props: DSCRTermSheetProps) {
  return (
    <div
      data-termsheet-root
      className="w-[816px] min-h-[1056px] bg-white border rounded-md shadow-sm mx-auto overflow-hidden p-8"
    >
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Bridge Term Sheet</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Bridge Loan
          </p>
        </div>
        
        {/* Placeholder content - replace with actual term sheet layout */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            <p>Term sheet component placeholder</p>
            <p className="mt-2">Props: {JSON.stringify(props, null, 2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
