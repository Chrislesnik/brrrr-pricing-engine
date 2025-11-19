// Type augmentation for TanStack Table meta to support custom actions used in cells
import type { RowData } from "@tanstack/react-table"
import "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface TableMeta<_TData extends RowData> {
    openPricingEngine?: (id: string) => void
    openTermSheets?: (id: string) => void
    toggleStatus?: (id: string) => void
    deleteLoan?: (id: string) => void
  }
}


