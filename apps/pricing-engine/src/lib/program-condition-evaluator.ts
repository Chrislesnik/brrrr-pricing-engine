import { supabaseAdmin } from "@/lib/supabase-admin";
import { evaluateOperator, toString } from "@/lib/logic-engine";

interface ProgramConditionRow {
  program_id: string;
  logic_type: string;
  field: number | null;
  operator: string | null;
  value_type: string | null;
  value: string | null;
  value_field: number | null;
  value_expression: string | null;
}

/**
 * Fetch all program conditions for a set of program IDs.
 * Returns a map of program_id -> { logic_type, conditions[] }.
 */
export async function fetchProgramConditions(programIds: string[]) {
  if (programIds.length === 0) return new Map<string, { logic_type: string; conditions: ProgramConditionRow[] }>();

  const { data } = await supabaseAdmin
    .from("program_conditions")
    .select("program_id, logic_type, field, operator, value_type, value, value_field, value_expression")
    .in("program_id", programIds);

  const map = new Map<string, { logic_type: string; conditions: ProgramConditionRow[] }>();
  for (const row of data ?? []) {
    const pid = row.program_id as string;
    if (!map.has(pid)) {
      map.set(pid, { logic_type: row.logic_type || "AND", conditions: [] });
    }
    map.get(pid)!.conditions.push(row as ProgramConditionRow);
  }
  return map;
}

/**
 * Evaluate whether a program's conditions pass against the given input values.
 * Input values are keyed by PE input ID (as string).
 * Programs with no conditions always pass.
 */
export function evaluateProgramConditions(
  conditions: ProgramConditionRow[],
  logicType: string,
  inputValues: Record<string, unknown>
): boolean {
  if (conditions.length === 0) return true;

  const results = conditions.map((c) => {
    if (!c.field || !c.operator) return true;
    const fieldKey = String(c.field);
    const fieldValue = inputValues[fieldKey] ?? null;

    let compareValue: unknown;
    const vt = c.value_type || "value";
    if (vt === "field" && c.value_field) {
      compareValue = inputValues[String(c.value_field)] ?? null;
    } else {
      compareValue = c.value;
    }

    return evaluateOperator(c.operator, fieldValue, compareValue);
  });

  if (logicType === "OR") {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}

/**
 * Filter programs by evaluating their conditions against input values.
 * Returns only the programs whose conditions pass.
 */
export async function filterProgramsByConditions<T extends { id?: string }>(
  programs: T[],
  inputValues: Record<string, unknown>
): Promise<T[]> {
  const programIds = programs.map((p) => p.id).filter(Boolean) as string[];
  const conditionsMap = await fetchProgramConditions(programIds);

  return programs.filter((p) => {
    const pid = p.id;
    if (!pid) return true;
    const entry = conditionsMap.get(pid);
    if (!entry || entry.conditions.length === 0) return true;
    return evaluateProgramConditions(entry.conditions, entry.logic_type, inputValues);
  });
}
