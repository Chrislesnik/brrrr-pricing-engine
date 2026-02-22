// Variable types for Template Editor
export type VariableType = "String" | "Number" | "Boolean" | "Array" | "Object" | "Binary Data"

export interface Variable {
  id: string
  name: string
  type: VariableType
  required?: boolean
  path?: string
}

// Shared color configuration for variable types
// Used by Variable Editor modal, Test Data panel, and canvas variable widgets
export interface TypeColorConfig {
  bg: string        // Tailwind background class
  text: string      // Tailwind text class
  border: string    // Tailwind border class
  hover: string     // Tailwind hover class
  // Raw hex colors for canvas CSS injection
  bgHex: string
  textHex: string
  borderHex: string
}

export const typeColorConfig: Record<VariableType, TypeColorConfig> = {
  "String": { 
    bg: "bg-yellow-500/15", 
    text: "text-yellow-600 dark:text-yellow-400", 
    border: "border-yellow-500/30",
    hover: "hover:bg-yellow-500/20",
    bgHex: "#eab30826",
    textHex: "#ca8a04",
    borderHex: "#eab3084d"
  },
  "Number": { 
    bg: "bg-emerald-500/15", 
    text: "text-emerald-600 dark:text-emerald-400", 
    border: "border-emerald-500/30",
    hover: "hover:bg-emerald-500/20",
    bgHex: "#10b98126",
    textHex: "#059669",
    borderHex: "#10b9814d"
  },
  "Boolean": { 
    bg: "bg-purple-500/15", 
    text: "text-purple-600 dark:text-purple-400", 
    border: "border-purple-500/30",
    hover: "hover:bg-purple-500/20",
    bgHex: "#a855f726",
    textHex: "#9333ea",
    borderHex: "#a855f74d"
  },
  "Array": { 
    bg: "bg-red-500/15", 
    text: "text-red-600 dark:text-red-400", 
    border: "border-red-500/30",
    hover: "hover:bg-red-500/20",
    bgHex: "#ef444426",
    textHex: "#dc2626",
    borderHex: "#ef44444d"
  },
  "Object": { 
    bg: "bg-orange-500/15", 
    text: "text-orange-600 dark:text-orange-400", 
    border: "border-orange-500/30",
    hover: "hover:bg-orange-500/20",
    bgHex: "#f9731626",
    textHex: "#ea580c",
    borderHex: "#f973164d"
  },
  "Binary Data": { 
    bg: "bg-blue-500/15", 
    text: "text-blue-600 dark:text-blue-400", 
    border: "border-blue-500/30",
    hover: "hover:bg-blue-500/20",
    bgHex: "#3b82f626",
    textHex: "#2563eb",
    borderHex: "#3b82f64d"
  },
}

// Get color config for a variable type (with fallback)
export function getTypeColors(type: VariableType): TypeColorConfig {
  return typeColorConfig[type] || typeColorConfig["String"]
}

// Default variables - empty, will be loaded from Supabase
export const defaultVariables: Variable[] = []

// Helper to generate a unique ID for new variables
export function generateVariableId(): string {
  return `variable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Convert variables to GrapeJS globalData format
// GrapesJS expects nested structure: { variableName: { data: "value" } }
export function variablesToGlobalData(variables: Variable[]): Record<string, { data: string }> {
  const globalData: Record<string, { data: string }> = {}
  variables.forEach((variable) => {
    let value: string
    switch (variable.type) {
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
        value = `{{${variable.name}}}`
    }
    globalData[variable.name] = { data: value }
  })
  return globalData
}
