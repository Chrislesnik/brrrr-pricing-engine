/**
 * Resolves GrapesJS document template HTML by substituting Handlebars variable
 * expressions with actual values from a webhook response.
 *
 * The webhook returns values keyed by variable UUID. We map those UUIDs to
 * variable names/paths (which match the Handlebars keys in the HTML), then
 * perform regex replacement on the two Handlebars patterns GrapesJS emits.
 */

export interface TemplateVariable {
  id: string;
  name: string;
  path: string;
  variable_type: string;
}

/**
 * Resolve all template variables in HTML content.
 *
 * @param htmlContent  Raw html_content from document_templates
 * @param variables    Variables for this template (from document_template_variables)
 * @param webhookData  Flat key-value map from n8n webhook, keyed by variable UUID
 * @returns            HTML string with Handlebars expressions replaced by values
 */
export function resolveTemplateVariables(
  htmlContent: string,
  variables: TemplateVariable[],
  webhookData: Record<string, string>
): string {
  // Build path -> value map by looking up each UUID
  const valueMap = new Map<string, string>();
  for (const v of variables) {
    const val = webhookData[v.id];
    if (val !== undefined && val !== null) {
      const key = v.path || v.name;
      valueMap.set(key, String(val));
    }
  }

  let result = htmlContent;

  // Pattern 1: {{#if var_name}}{{{var_name}}}{{else}}Default{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}\{\{\{\1\}\}\}\{\{else\}\}([^{]*)\{\{\/if\}\}/g,
    (_match, varName: string, defaultValue: string) => {
      return valueMap.get(varName) ?? defaultValue;
    }
  );

  // Pattern 2: {{#if globalData.var_name.data.data}}{{{globalData.var_name.data.data}}}{{else}}Default{{/if}}
  result = result.replace(
    /\{\{#if\s+globalData\.(\w+)\.data\.data\}\}\{\{\{globalData\.\w+\.data\.data\}\}\}\{\{else\}\}([^{]*)\{\{\/if\}\}/g,
    (_match, varName: string, defaultValue: string) => {
      return valueMap.get(varName) ?? defaultValue;
    }
  );

  // Pattern 3: Simple triple-stache {{{var_name}}} (no conditional wrapper)
  result = result.replace(
    /\{\{\{(\w+)\}\}\}/g,
    (_match, varName: string) => {
      return valueMap.get(varName) ?? `{{{${varName}}}}`;
    }
  );

  // Pattern 4: Simple double-stache {{var_name}} (no conditional wrapper)
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_match, varName: string) => {
      return valueMap.get(varName) ?? `{{${varName}}}`;
    }
  );

  return result;
}
