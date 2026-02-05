"use client"

import { useRef, useEffect } from "react"

interface TemplatePreviewProps {
  html: string
  className?: string
}

/**
 * Renders an HTML template as a scaled-down thumbnail preview.
 * Uses an iframe with CSS transform to create a miniature view.
 */
export function TemplatePreview({ html, className = "" }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Write the HTML content to the iframe
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
              font-size: 12px;
              line-height: 1.4;
            }
            /* Scale down table padding for preview */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td {
              padding: 4px 6px !important;
              font-size: 10px;
            }
            h1 {
              font-size: 16px !important;
            }
            h3 {
              font-size: 11px !important;
            }
            p {
              font-size: 10px;
            }
            /* Prevent scrolling */
            html, body {
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${extractBodyContent(html)}
        </body>
      </html>
    `)
    doc.close()
  }, [html])

  return (
    <div className={`relative w-full h-full overflow-hidden bg-white ${className}`}>
      {/* Container for the scaled iframe */}
      <div 
        className="absolute inset-0"
        style={{
          transform: "scale(0.25)",
          transformOrigin: "top left",
          width: "400%",
          height: "400%",
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
        className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"
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
