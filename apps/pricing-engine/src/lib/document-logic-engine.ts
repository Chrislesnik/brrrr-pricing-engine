/**
 * Document logic engine — evaluates document_logic rules against current
 * deal input values to determine which document types are visible/required.
 *
 * Reuses condition evaluation from the main logic engine.
 */

import { evaluateRuleConditions } from "./logic-engine";
import type { LogicCondition } from "@/context/logic-rules-context";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface DocumentLogicCondition {
  field: string;
  operator: string;
  value: string;
  value_type: "value" | "field" | "expression";
  value_field?: string;
  value_expression?: string;
}

export interface DocumentLogicAction {
  document_type_id: number;
  value_type: string; // visible | not_visible | required | not_required
  value_visible?: boolean;
  value_required?: boolean;
}

export interface DocumentLogicRule {
  id?: number;
  type: "AND" | "OR";
  conditions: DocumentLogicCondition[];
  actions: DocumentLogicAction[];
}

export interface DocumentLogicResult {
  /** Document type IDs that should be hidden */
  hiddenDocTypes: Set<number>;
  /** Document type IDs that should be required */
  requiredDocTypes: Set<number>;
}

/* -------------------------------------------------------------------------- */
/*  Main evaluation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Evaluate all document logic rules against the current deal input values.
 *
 * Document logic conditions reference input fields (same as input_logic
 * conditions), but actions target document_type_id instead of input_id.
 *
 * Default: all document types are visible and not required.
 * Rules can override to hidden or required.
 */
export function evaluateDocumentRules(
  rules: DocumentLogicRule[],
  currentValues: Record<string, unknown>
): DocumentLogicResult {
  const hiddenDocTypes = new Set<number>();
  const requiredDocTypes = new Set<number>();

  if (!rules || rules.length === 0) {
    return { hiddenDocTypes, requiredDocTypes };
  }

  // Process rules in order (last rule wins for conflicts on the same doc type)
  for (const rule of rules) {
    // Reuse the shared condition evaluator by adapting the rule shape.
    // DocumentLogicCondition is structurally identical to LogicCondition.
    const conditionsAsMapped = rule.conditions as unknown as LogicCondition[];

    const ruleAsLogic = {
      type: rule.type,
      conditions: conditionsAsMapped,
      actions: [], // not used — we handle actions ourselves
    };

    const conditionsMet = evaluateRuleConditions(ruleAsLogic, currentValues);

    if (!conditionsMet) continue;

    // Apply actions
    for (const action of rule.actions) {
      const docTypeId = action.document_type_id;
      if (!docTypeId) continue;

      switch (action.value_type) {
        case "visible":
          hiddenDocTypes.delete(docTypeId); // ensure visible
          break;
        case "not_visible":
          hiddenDocTypes.add(docTypeId);
          break;
        case "required":
          requiredDocTypes.add(docTypeId);
          break;
        case "not_required":
          requiredDocTypes.delete(docTypeId);
          break;
      }
    }
  }

  return { hiddenDocTypes, requiredDocTypes };
}
