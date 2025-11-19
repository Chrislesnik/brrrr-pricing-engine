// Type augmentation for TanStack Table meta to support custom actions used in cells
import type { RowData } from "@tanstack/table-core"

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    openPricingEngine?: (id: string) => void
    openTermSheets?: (id: string) => void
    toggleStatus?: (id: string) => void
  }
}


