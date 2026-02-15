"use client"

import { useRef, useEffect } from "react"

interface TemplatePreviewProps {
  html: string
  className?: string
}

/**
 * Renders an HTML template as a scaled-down thumbnail preview.
 * Shows the top portion of the document at 50% scale (Google Drive style).
 */
export function TemplatePreview({ html, className = "" }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Write the HTML content to the iframe
    const cleanedHtml = replaceVariablesWithPills(extractBodyContent(html))
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background: white;
              padding: 20px;
              line-height: 1.4;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            /* Prevent scrolling */
            html, body {
              overflow: hidden;
            }
            .var-pill {
              display: inline-block;
              padding: 1px 6px;
              border-radius: 9999px;
              font-size: 0.7em;
              font-weight: 500;
              white-space: nowrap;
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #f59e0b;
              vertical-align: baseline;
            }
          </style>
        </head>
        <body>
          ${cleanedHtml}
        </body>
      </html>
    `)
    doc.close()
  }, [html])

  return (
    <div className={`relative w-full h-full overflow-hidden bg-white ${className}`}>
      {/* Container for the scaled iframe - 50% zoom showing top of document */}
      <div 
        className="absolute inset-0"
        style={{
          transform: "scale(0.5)",
          transformOrigin: "top left",
          width: "200%",
          height: "200%",
        }}
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 pointer-events-none"
          sandbox="allow-same-origin"
          title="Template Preview"
        />
      </div>
      
      {/* Gradient overlay to fade out bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-card to-transparent pointer-events-none"
      />
    </div>
  )
}

/**
 * Extracts just the body content from a full HTML document
 */
function extractBodyContent(html: string): string {
  // Try to extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    return bodyMatch[1]
  }
  // If no body tags, return the whole HTML
  return html
}

/**
 * Replaces Handlebars data-source expressions with clean {{field_name}} pill tags.
 *
 * GrapesJS stores variables as:
 *   {{#if globalData.field_name.data.data}}{{{globalData.field_name.data.data}}}{{else}}Default{{/if}}
 *
 * This converts them into styled <span class="var-pill">{{field_name}}</span> for the preview.
 */
function replaceVariablesWithPills(html: string): string {
  // Match the full handlebars if/else block for globalData variables
  return html.replace(
    /\{\{#if\s+globalData\.(\w+)\.data\.data\}\}\{\{\{globalData\.\w+\.data\.data\}\}\}\{\{else\}\}[^{]*\{\{\/if\}\}/g,
    (_match, fieldName: string) => {
      const label = fieldName.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
      return `<span class="var-pill">{{ ${label} }}</span>`
    }
  )
}
