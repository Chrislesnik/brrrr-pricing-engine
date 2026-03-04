export interface TableColumnDef {
  key: string
  label: string
  type: "text" | "currency" | "number" | "percentage" | "toggle" | "dropdown" | "readonly"
  width?: number
  required?: boolean
  options?: string[]
  placeholder?: string
}

export interface TableConfig {
  row_source:
    | { type: "fixed"; count: number }
    | { type: "input"; input_code: string }
  row_label_template?: string
  columns: TableColumnDef[]
}

export const TABLE_COLUMN_TYPES = [
  { value: "text", label: "Text" },
  { value: "currency", label: "Currency" },
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage" },
  { value: "toggle", label: "Toggle (Yes/No)" },
  { value: "dropdown", label: "Dropdown" },
  { value: "readonly", label: "Read-only" },
] as const

export function generateColumnKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "col"
}
