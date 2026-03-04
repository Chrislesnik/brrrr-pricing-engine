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
export interface OrgLogos {
  light: string | null;
  dark: string | null;
}

export function resolveTemplateVariables(
  htmlContent: string,
  variables: TemplateVariable[],
  webhookData: Record<string, string>,
  orgLogos?: OrgLogos
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

  // Pattern 5: QR code <img> tags with data-qr-mode="variable"
  // GrapesJS QR components export as <img ... data-qr-mode="variable" data-qr-variable="var_name" data-qr-size="150" src="...">
  // Replace the src with the resolved QR API URL using the actual variable value
  result = result.replace(
    /<img([^>]*?)data-qr-mode="variable"([^>]*?)data-qr-variable="(\w+)"([^>]*?)>/gi,
    (match, before: string, mid: string, varName: string, after: string) => {
      const val = valueMap.get(varName);
      if (!val) return match;
      const sizeMatch = (before + mid + after).match(/data-qr-size="(\d+)"/)
      const size = sizeMatch ? sizeMatch[1] : "150";
      const newSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(val)}`;
      const full = before + `data-qr-mode="variable"` + mid + `data-qr-variable="${varName}"` + after;
      const updated = full.replace(/src="[^"]*"/, `src="${newSrc}"`);
      return `<img${updated}>`;
    }
  );

  // Also handle when data-qr-variable appears before data-qr-mode in the attribute order
  result = result.replace(
    /<img([^>]*?)data-qr-variable="(\w+)"([^>]*?)data-qr-mode="variable"([^>]*?)>/gi,
    (match, before: string, varName: string, mid: string, after: string) => {
      const val = valueMap.get(varName);
      if (!val) return match;
      const sizeMatch = (before + mid + after).match(/data-qr-size="(\d+)"/)
      const size = sizeMatch ? sizeMatch[1] : "150";
      const newSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(val)}`;
      const full = before + `data-qr-variable="${varName}"` + mid + `data-qr-mode="variable"` + after;
      const updated = full.replace(/src="[^"]*"/, `src="${newSrc}"`);
      return `<img${updated}>`;
    }
  );

  // Pattern 6: Brand logo <img> tags with data-brand-logo="light" or "dark"
  if (orgLogos) {
    result = result.replace(
      /<img([^>]*?)data-brand-logo="(light|dark)"([^>]*?)>/gi,
      (match, before: string, mode: string, after: string) => {
        const logoUrl = mode === "dark" ? orgLogos.dark : orgLogos.light;
        if (!logoUrl) return match;
        const full = before + `data-brand-logo="${mode}"` + after;
        const hasSrc = /src="[^"]*"/.test(full);
        const updated = hasSrc
          ? full.replace(/src="[^"]*"/, `src="${logoUrl}"`)
          : full + ` src="${logoUrl}"`;
        return `<img${updated}>`;
      }
    );
  }

  return result;
}
