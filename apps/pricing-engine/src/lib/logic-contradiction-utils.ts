/* -------------------------------------------------------------------------- */
/*  Logic Rule Contradiction Detection                                         */
/*                                                                             */
/*  Detects conflicting actions both within a single rule and across rules     */
/*  whose conditions could potentially overlap (fire simultaneously).          */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Shared types                                                               */
/* -------------------------------------------------------------------------- */

interface BaseCondition {
  field: string;
  operator: string;
  value: string;
  value_type?: string;
}

/** Per-rule collection of warning messages to display in the tooltip. */
export type RuleWarningsMap = Map<number, string[]>;

/* -------------------------------------------------------------------------- */
/*  Mutual exclusivity check                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Two rules are mutually exclusive if there exists at least one pair of
 * conditions (one from each rule) that reference the SAME field with an
 * "equals" operator but DIFFERENT literal values.
 *
 * If mutually exclusive, both rules can never fire at the same time,
 * so conflicting actions between them are safe.
 */
function areConditionsMutuallyExclusive(
  conditionsA: BaseCondition[],
  conditionsB: BaseCondition[],
): boolean {
  for (const a of conditionsA) {
    // Only consider literal-value equals conditions
    if (a.operator !== "equals") continue;
    if (a.value_type && a.value_type !== "value") continue;
    if (!a.field || !a.value) continue;

    for (const b of conditionsB) {
      if (b.operator !== "equals") continue;
      if (b.value_type && b.value_type !== "value") continue;
      if (!b.field || !b.value) continue;

      // Same field, equals operator, but different values → mutually exclusive
      if (a.field === b.field && a.value !== b.value) {
        return true;
      }
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Visibility / Required toggle conflict helpers                              */
/* -------------------------------------------------------------------------- */

type ToggleCategory = "visibility" | "required";

function getToggleCategory(
  valueType: string,
): { category: ToggleCategory; positive: boolean } | null {
  switch (valueType) {
    case "visible":
      return { category: "visibility", positive: true };
    case "not_visible":
      return { category: "visibility", positive: false };
    case "required":
      return { category: "required", positive: true };
    case "not_required":
      return { category: "required", positive: false };
    default:
      return null;
  }
}

const TOGGLE_LABEL: Record<string, string> = {
  visible: "Visible",
  not_visible: "Not Visible",
  required: "Required",
  not_required: "Not Required",
};

/* -------------------------------------------------------------------------- */
/*  Input Logic Conflicts                                                      */
/* -------------------------------------------------------------------------- */

interface InputAction {
  input_id: string;
  value_type: string;
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
}

interface InputLogicRule {
  type: string;
  conditions: BaseCondition[];
  actions: InputAction[];
}

/**
 * Detect contradictions among input logic rules.
 * Returns a map from ruleIndex → array of human-readable warning strings.
 */
export function detectInputLogicConflicts(
  rules: InputLogicRule[],
  getInputLabel: (inputId: string) => string,
): RuleWarningsMap {
  const warnings: RuleWarningsMap = new Map();

  const addWarning = (ruleIndex: number, msg: string) => {
    if (!warnings.has(ruleIndex)) warnings.set(ruleIndex, []);
    warnings.get(ruleIndex)!.push(msg);
  };

  // 1. Within-rule conflicts
  for (let ri = 0; ri < rules.length; ri++) {
    const actions = rules[ri].actions;
    for (let ai = 0; ai < actions.length; ai++) {
      for (let bi = ai + 1; bi < actions.length; bi++) {
        const a = actions[ai];
        const b = actions[bi];
        if (!a.input_id || !b.input_id || a.input_id !== b.input_id) continue;

        const conflict = describeInputActionConflict(a, b, getInputLabel);
        if (conflict) {
          addWarning(ri, conflict);
        }
      }
    }
  }

  // 2. Cross-rule conflicts
  for (let ri = 0; ri < rules.length; ri++) {
    for (let rj = ri + 1; rj < rules.length; rj++) {
      // Skip if mutually exclusive conditions
      if (
        areConditionsMutuallyExclusive(
          rules[ri].conditions,
          rules[rj].conditions,
        )
      ) {
        continue;
      }

      // Compare all action pairs across the two rules
      for (const a of rules[ri].actions) {
        for (const b of rules[rj].actions) {
          if (!a.input_id || !b.input_id || a.input_id !== b.input_id) continue;

          const conflict = describeInputActionConflict(a, b, getInputLabel);
          if (conflict) {
            addWarning(ri, `${conflict} (Rule #${rj + 1})`);
            addWarning(rj, `${conflict} (Rule #${ri + 1})`);
          }
        }
      }
    }
  }

  return warnings;
}

/**
 * Compare two input actions targeting the same input_id.
 * Returns a human-readable conflict message, or null if no conflict.
 */
function describeInputActionConflict(
  a: InputAction,
  b: InputAction,
  getInputLabel: (id: string) => string,
): string | null {
  const label = getInputLabel(a.input_id);

  // Check toggle conflicts (visible/not_visible, required/not_required)
  const toggleA = getToggleCategory(a.value_type);
  const toggleB = getToggleCategory(b.value_type);

  if (toggleA && toggleB && toggleA.category === toggleB.category) {
    if (toggleA.positive !== toggleB.positive) {
      return `${label}: ${TOGGLE_LABEL[a.value_type]} contradicts ${TOGGLE_LABEL[b.value_type]}`;
    }
    // Same toggle, same direction → not a conflict
    return null;
  }

  // If one is a toggle and the other is a different toggle category or a value,
  // they are complementary (e.g. visible + required), not a conflict
  if (toggleA || toggleB) return null;

  // Both are value-setting types (value, field, expression)
  // If same type, compare values
  if (a.value_type === "value" && b.value_type === "value") {
    if (a.value_text !== b.value_text) {
      const aVal = a.value_text || "(empty)";
      const bVal = b.value_text || "(empty)";
      return `${label}: value "${aVal}" contradicts "${bVal}"`;
    }
    return null;
  }

  if (a.value_type === "field" && b.value_type === "field") {
    if (a.value_field !== b.value_field) {
      return `${label}: set to different field references`;
    }
    return null;
  }

  if (a.value_type === "expression" && b.value_type === "expression") {
    if (a.value_expression !== b.value_expression) {
      return `${label}: set to different expressions`;
    }
    return null;
  }

  // Different value-setting types (e.g. one is "value", other is "field")
  // targeting the same input → likely a conflict
  if (
    ["value", "field", "expression"].includes(a.value_type) &&
    ["value", "field", "expression"].includes(b.value_type)
  ) {
    return `${label}: set via "${a.value_type}" and "${b.value_type}" simultaneously`;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Document Logic Conflicts                                                   */
/* -------------------------------------------------------------------------- */

interface DocAction {
  document_type_id: number;
  value_type: string;
  value_visible?: boolean;
  value_required?: boolean;
}

interface DocLogicRule {
  type: string;
  conditions: BaseCondition[];
  actions: DocAction[];
}

/**
 * Detect contradictions among document logic rules.
 * Returns a map from ruleIndex → array of human-readable warning strings.
 */
export function detectDocumentLogicConflicts(
  rules: DocLogicRule[],
  getDocTypeName: (id: number) => string,
): RuleWarningsMap {
  const warnings: RuleWarningsMap = new Map();

  const addWarning = (ruleIndex: number, msg: string) => {
    if (!warnings.has(ruleIndex)) warnings.set(ruleIndex, []);
    warnings.get(ruleIndex)!.push(msg);
  };

  // 1. Within-rule conflicts
  for (let ri = 0; ri < rules.length; ri++) {
    const actions = rules[ri].actions;
    for (let ai = 0; ai < actions.length; ai++) {
      for (let bi = ai + 1; bi < actions.length; bi++) {
        const a = actions[ai];
        const b = actions[bi];
        if (!a.document_type_id || !b.document_type_id) continue;
        if (a.document_type_id !== b.document_type_id) continue;

        const conflict = describeDocActionConflict(a, b, getDocTypeName);
        if (conflict) {
          addWarning(ri, conflict);
        }
      }
    }
  }

  // 2. Cross-rule conflicts
  for (let ri = 0; ri < rules.length; ri++) {
    for (let rj = ri + 1; rj < rules.length; rj++) {
      if (
        areConditionsMutuallyExclusive(
          rules[ri].conditions,
          rules[rj].conditions,
        )
      ) {
        continue;
      }

      for (const a of rules[ri].actions) {
        for (const b of rules[rj].actions) {
          if (!a.document_type_id || !b.document_type_id) continue;
          if (a.document_type_id !== b.document_type_id) continue;

          const conflict = describeDocActionConflict(a, b, getDocTypeName);
          if (conflict) {
            addWarning(ri, `${conflict} (Rule #${rj + 1})`);
            addWarning(rj, `${conflict} (Rule #${ri + 1})`);
          }
        }
      }
    }
  }

  return warnings;
}

/**
 * Compare two document actions targeting the same document_type_id.
 * Documents only support toggle types (visible/not_visible/required/not_required).
 */
function describeDocActionConflict(
  a: DocAction,
  b: DocAction,
  getDocTypeName: (id: number) => string,
): string | null {
  const label = getDocTypeName(a.document_type_id);

  const toggleA = getToggleCategory(a.value_type);
  const toggleB = getToggleCategory(b.value_type);

  if (toggleA && toggleB && toggleA.category === toggleB.category) {
    if (toggleA.positive !== toggleB.positive) {
      return `${label}: ${TOGGLE_LABEL[a.value_type]} contradicts ${TOGGLE_LABEL[b.value_type]}`;
    }
  }

  return null;
}
