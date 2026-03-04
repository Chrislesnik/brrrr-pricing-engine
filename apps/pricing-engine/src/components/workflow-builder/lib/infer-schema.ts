import { nanoid } from "nanoid";
import type { SchemaField } from "../workflow/config/schema-builder";

/**
 * Infer a SchemaField[] from an arbitrary JSON value, fully recursive.
 * Arrays inspect the first element for itemType / nested fields.
 */
export function inferSchemaFromData(data: unknown): SchemaField[] {
  if (typeof data !== "object" || data === null) return [];
  if (Array.isArray(data)) {
    return inferArrayItems(data);
  }
  return inferObjectKeys(data as Record<string, unknown>);
}

function inferArrayItems(arr: unknown[]): SchemaField[] {
  if (arr.length === 0) return [];
  const sample = arr[0];
  if (typeof sample === "object" && sample !== null && !Array.isArray(sample)) {
    return inferObjectKeys(sample as Record<string, unknown>);
  }
  return [];
}

function inferObjectKeys(obj: Record<string, unknown>): SchemaField[] {
  const fields: SchemaField[] = [];
  for (const [key, value] of Object.entries(obj)) {
    fields.push(inferField(key, value));
  }
  return fields;
}

function inferField(name: string, value: unknown): SchemaField {
  const field: SchemaField = { id: nanoid(), name, type: "string" };

  if (value === null || value === undefined) {
    return field;
  }

  if (Array.isArray(value)) {
    field.type = "array";
    if (value.length > 0) {
      const sample = value[0];
      const itemType = primitiveType(sample);
      if (itemType) {
        field.itemType = itemType;
      } else if (typeof sample === "object" && sample !== null) {
        field.itemType = "object";
        field.fields = inferObjectKeys(sample as Record<string, unknown>);
      }
    } else {
      field.itemType = "string";
    }
    return field;
  }

  if (typeof value === "object") {
    field.type = "object";
    field.fields = inferObjectKeys(value as Record<string, unknown>);
    return field;
  }

  const prim = primitiveType(value);
  if (prim) {
    field.type = prim;
  }

  return field;
}

function primitiveType(
  value: unknown
): "string" | "number" | "boolean" | undefined {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "string";
  return undefined;
}
