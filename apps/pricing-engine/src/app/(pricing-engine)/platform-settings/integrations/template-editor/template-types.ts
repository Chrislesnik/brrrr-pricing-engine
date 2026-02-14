/**
 * Document Template Types
 */

export interface DocumentTemplate {
  id: string
  name: string
  html_content: string // GrapesJS HTML output
  gjs_data: object     // GrapesJS project JSON for re-editing
  created_at: string
  updated_at: string
  user_id: string
}

// Default blank template HTML for new templates
// Note: presetPrintable needs at least one component/element to recognize it as valid content
// An empty body will cause the plugin to inject its own default template
export const defaultTemplateHtml = `<div data-gjs-type="wrapper" style="padding: 40px; font-family: Arial, Helvetica, sans-serif; min-height: 100vh;"></div>`
