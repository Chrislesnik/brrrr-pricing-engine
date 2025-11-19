// Type augmentation for TanStack Table meta to support custom actions used in cells
import type { RowData } from "@tanstack/table-core"

declare module "@tanstack/table-core" {
  interface TableMeta<_TData extends RowData> {
    openPricingEngine?: (id: string) => void
    openTermSheets?: (id: string) => void
    toggleStatus?: (id: string) => void
    deleteLoan?: (id: string) => void
  }
}

// Some packages reference the react-table module for TableMeta,
// so augment that module as well to satisfy type checking.
declare module "@tanstack/react-table" {
  interface TableMeta<_TData extends RowData> {
    openPricingEngine?: (id: string) => void
    openTermSheets?: (id: string) => void
    toggleStatus?: (id: string) => void
    deleteLoan?: (id: string) => void
  }
}


