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
export function fieldsToGlobalData(fields: Field[]): Record<string, string> {
  const globalData: Record<string, string> = {}
  fields.forEach((field) => {
    // Use placeholder value based on type
    switch (field.type) {
      case "Number":
        globalData[field.name] = "0"
        break
      case "Boolean":
        globalData[field.name] = "true"
        break
      case "Array":
        globalData[field.name] = "[]"
        break
      case "Object":
        globalData[field.name] = "{}"
        break
      case "Binary Data":
        globalData[field.name] = "/placeholder.png"
        break
      default:
        globalData[field.name] = `{{${field.name}}}`
    }
  })
  return globalData
}
