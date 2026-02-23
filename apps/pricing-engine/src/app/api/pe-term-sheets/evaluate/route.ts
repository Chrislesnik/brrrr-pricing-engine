import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { evaluateOperator } from "@/lib/logic-engine";

interface ConditionRow {
  id: number;
  pe_term_sheet_rule_id: number;
  field: number | null;
  operator: string | null;
  value_type: string | null;
  value: string | null;
  value_field: number | null;
  value_expression: string | null;
}

interface RuleRow {
  id: number;
  pe_term_sheet_id: number;
  logic_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const inputValues = (body.input_values ?? {}) as Record<string, unknown>;

    let orgLogos: { light: string | null; dark: string | null } = { light: null, dark: null };
    let isInternal = false;
    if (orgId) {
      const orgUuid = await getOrgUuidFromClerkId(orgId);
      if (orgUuid) {
        const { data: orgData } = await supabaseAdmin
          .from("organizations")
          .select("whitelabel_logo_light_url, whitelabel_logo_dark_url, is_internal_yn")
          .eq("id", orgUuid)
          .maybeSingle();
        if (orgData) {
          orgLogos = {
            light: orgData.whitelabel_logo_light_url ?? null,
            dark: orgData.whitelabel_logo_dark_url ?? null,
          };
          isInternal = orgData.is_internal_yn === true;
        }
      }
    }

    // 1. Fetch all active pe_term_sheets joined with document_templates
    const { data: termSheets, error: tsErr } = await supabaseAdmin
      .from("pe_term_sheets")
      .select("id, document_template_id, status, display_order, document_templates(id, name, html_content)")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (tsErr) {
      return NextResponse.json({ error: tsErr.message }, { status: 500 });
    }

    if (!termSheets || termSheets.length === 0) {
      return NextResponse.json({ term_sheets: [] });
    }

    // 2. Fetch all rules for these term sheets
    const tsIds = termSheets.map((ts) => ts.id);

    const { data: rules, error: rulesErr } = await supabaseAdmin
      .from("pe_term_sheet_rules")
      .select("id, pe_term_sheet_id, logic_type")
      .in("pe_term_sheet_id", tsIds)
      .order("created_at", { ascending: true });

    if (rulesErr) {
      return NextResponse.json({ error: rulesErr.message }, { status: 500 });
    }

    // 3. Fetch all conditions for these rules
    const ruleIds = (rules ?? []).map((r: RuleRow) => r.id);
    let conditions: ConditionRow[] = [];

    if (ruleIds.length > 0) {
      const { data: condData, error: condErr } = await supabaseAdmin
        .from("pe_term_sheet_conditions")
        .select("id, pe_term_sheet_rule_id, field, operator, value_type, value, value_field, value_expression")
        .in("pe_term_sheet_rule_id", ruleIds);

      if (condErr) {
        return NextResponse.json({ error: condErr.message }, { status: 500 });
      }
      conditions = (condData ?? []) as ConditionRow[];
    }

    // 4. Fetch pricing_engine_inputs for id -> input_code mapping
    const { data: peInputs, error: peErr } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .select("id, input_code")
      .is("archived_at", null);

    if (peErr) {
      return NextResponse.json({ error: peErr.message }, { status: 500 });
    }

    const idToCode = new Map<number, string>();
    for (const inp of peInputs ?? []) {
      idToCode.set(inp.id, inp.input_code);
    }

    // Group rules by term sheet
    const rulesByTs = new Map<number, RuleRow[]>();
    for (const r of (rules ?? []) as RuleRow[]) {
      if (!rulesByTs.has(r.pe_term_sheet_id)) rulesByTs.set(r.pe_term_sheet_id, []);
      rulesByTs.get(r.pe_term_sheet_id)!.push(r);
    }

    // Group conditions by rule
    const condsByRule = new Map<number, ConditionRow[]>();
    for (const c of conditions) {
      if (!condsByRule.has(c.pe_term_sheet_rule_id)) condsByRule.set(c.pe_term_sheet_rule_id, []);
      condsByRule.get(c.pe_term_sheet_rule_id)!.push(c);
    }

    // 5. Evaluate conditions for each term sheet
    const matchingIds: number[] = [];

    for (const ts of termSheets) {
      const tsRules = rulesByTs.get(ts.id) ?? [];

      // No rules = always matches
      if (tsRules.length === 0) {
        matchingIds.push(ts.id);
        continue;
      }

      // A term sheet matches if ANY rule group evaluates to true
      let anyRuleMatches = false;
      for (const rule of tsRules) {
        const ruleConds = condsByRule.get(rule.id) ?? [];

        if (ruleConds.length === 0) {
          anyRuleMatches = true;
          break;
        }

        const results = ruleConds.map((cond) => {
          const inputCode = cond.field != null ? idToCode.get(cond.field) : undefined;
          const fieldValue = inputCode ? inputValues[inputCode] : undefined;

          let compareValue: unknown;
          const vt = cond.value_type ?? "value";
          if (vt === "value") {
            compareValue = cond.value;
          } else if (vt === "field") {
            const refCode = cond.value_field != null ? idToCode.get(cond.value_field) : undefined;
            compareValue = refCode ? inputValues[refCode] : undefined;
          } else {
            compareValue = cond.value_expression;
          }

          return evaluateOperator(cond.operator ?? "", fieldValue, compareValue);
        });

        const ruleMatches =
          rule.logic_type === "OR"
            ? results.some((r) => r)
            : results.every((r) => r);

        if (ruleMatches) {
          anyRuleMatches = true;
          break;
        }
      }

      if (anyRuleMatches) {
        matchingIds.push(ts.id);
      }
    }

    // 6. For matching term sheets, fetch document_template_variables
    const matchingSheets = termSheets.filter((ts) => matchingIds.includes(ts.id));
    const templateIds = matchingSheets
      .map((ts) => ts.document_template_id)
      .filter(Boolean);

    let variables: { id: string; template_id: string; name: string; variable_type: string; path: string | null }[] = [];

    if (templateIds.length > 0) {
      const { data: varsData, error: varsErr } = await supabaseAdmin
        .from("document_template_variables")
        .select("id, template_id, name, variable_type, path")
        .in("template_id", templateIds)
        .order("position", { ascending: true });

      if (varsErr) {
        return NextResponse.json({ error: varsErr.message }, { status: 500 });
      }
      variables = varsData ?? [];
    }

    // Group variables by template_id
    const varsByTemplate = new Map<string, typeof variables>();
    for (const v of variables) {
      if (!varsByTemplate.has(v.template_id)) varsByTemplate.set(v.template_id, []);
      varsByTemplate.get(v.template_id)!.push(v);
    }

    // 7. Build response
    const result = matchingSheets.map((ts) => {
      const tmpl = ts.document_templates as { id: string; name: string; html_content: string } | null;
      const tmplVars = tmpl ? (varsByTemplate.get(tmpl.id) ?? []) : [];

      return {
        id: String(ts.id),
        template_name: tmpl?.name ?? "Unknown Template",
        html_content: tmpl?.html_content ?? "",
        variables: tmplVars.map((v) => ({
          id: v.id,
          name: v.name,
          path: v.path ?? v.name,
          variable_type: v.variable_type,
        })),
      };
    });

    return NextResponse.json({ term_sheets: result, org_logos: orgLogos, is_internal: isInternal });
  } catch (error) {
    console.error("[POST /api/pe-term-sheets/evaluate]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
