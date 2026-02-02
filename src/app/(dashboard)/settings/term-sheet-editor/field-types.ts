// Field types for Term Sheet Editor
export type FieldType = "String" | "Number" | "Boolean" | "Array" | "Object" | "Binary Data"

export interface Field {
  id: string
  name: string
  type: FieldType
  required?: boolean
}

// Default fields - empty, will be loaded from Supabase
export const defaultFields: Field[] = []

// Helper to generate a unique ID for new fields
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Convert fields to GrapeJS globalData format
// GrapesJS expects nested structure: { fieldName: { data: "value" } }
export function fieldsToGlobalData(fields: Field[]): Record<string, { data: string }> {
  const globalData: Record<string, { data: string }> = {}
  fields.forEach((field) => {
    // Use placeholder value based on type
    let value: string
    switch (field.type) {
      case "Number":
        value = "0"
        break
      case "Boolean":
        value = "true"
        break
      case "Array":
        value = "[]"
        break
      case "Object":
        value = "{}"
        break
      case "Binary Data":
        value = "/placeholder.png"
        break
      default:
        value = `{{${field.name}}}`
    }
    globalData[field.name] = { data: value }
  })
  return globalData
}
