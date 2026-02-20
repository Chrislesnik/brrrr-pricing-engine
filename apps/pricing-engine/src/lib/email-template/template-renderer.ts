import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import type { MergeValues } from "./merge-resolver"

// ─── Tiptap JSON types (minimal) ─────────────────────────────────────────────

type TiptapNode = {
  type: string
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

type TiptapMark = {
  type: string
  attrs?: Record<string, unknown>
}

// ─── Walk the document, replacing mergeTag nodes with resolved text ───────────

function resolveNode(node: TiptapNode, values: MergeValues): TiptapNode {
  if (node.type === "mergeTag") {
    const name = (node.attrs?.name as string) ?? ""
    const resolved = values[name] ?? `{{${node.attrs?.label ?? name}}}`
    return { type: "text", text: resolved }
  }

  if (Array.isArray(node.content)) {
    return { ...node, content: node.content.map((child) => resolveNode(child, values)) }
  }

  return node
}

// ─── Generate email-safe HTML from resolved Tiptap JSON ──────────────────────

/**
 * Takes a raw Tiptap JSON document (as stored in Liveblocks / email_templates.editor_json),
 * substitutes all mergeTag nodes with their resolved values, and returns email-safe HTML.
 */
export function renderTemplate(
  editorJson: Record<string, unknown>,
  values: MergeValues,
  styles?: {
    fontFamily?: string
    fontSize?: number
    lineHeight?: number
    containerWidth?: number
    bodyBackground?: string
    containerBackground?: string
    linkColor?: string
    buttonBackground?: string
    buttonTextColor?: string
    buttonRadius?: number
  }
): string {
  const resolved = resolveNode(editorJson as TiptapNode, values)

  const bodyHtml = generateHTML(resolved as Parameters<typeof generateHTML>[0], [StarterKit, Link])

  const font = styles?.fontFamily ?? "Inter, -apple-system, sans-serif"
  const fontSize = styles?.fontSize ?? 15
  const lineHeight = styles?.lineHeight ?? 160
  const width = styles?.containerWidth ?? 600
  const bodyBg = styles?.bodyBackground ?? "#f3f3f3"
  const containerBg = styles?.containerBackground ?? "#ffffff"
  const linkColor = styles?.linkColor ?? "#2563eb"
  const btnBg = styles?.buttonBackground ?? "#111111"
  const btnColor = styles?.buttonTextColor ?? "#ffffff"
  const btnRadius = styles?.buttonRadius ?? 6

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: ${bodyBg};
      font-family: ${font};
      font-size: ${fontSize}px;
      line-height: ${lineHeight}%;
      color: #111111;
      -webkit-text-size-adjust: 100%;
    }
    table { border-collapse: collapse; }
    img { border: 0; display: block; max-width: 100%; }
    a { color: ${linkColor}; }
    p { margin: 0 0 1em 0; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; line-height: 1.2; }
    ul, ol { padding-left: 1.5em; margin: 0 0 1em 0; }
    pre, code { font-family: monospace; background: #f0f0f0; border-radius: 4px; }
    pre { padding: 12px; overflow: auto; }
    code { padding: 2px 5px; }
    blockquote { border-left: 3px solid #e5e5e5; margin: 0; padding-left: 1em; color: #666; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 1.5em 0; }
    .email-button {
      display: inline-block;
      background: ${btnBg};
      color: ${btnColor} !important;
      border-radius: ${btnRadius}px;
      padding: 10px 20px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="${width}" cellpadding="0" cellspacing="0"
               style="max-width:${width}px; width:100%; background:${containerBg}; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="padding: 32px 40px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
