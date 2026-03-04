import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
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

function resolveTextMergeTags(text: string, values: MergeValues): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, name: string) => {
    const trimmed = name.trim()
    return values[trimmed] ?? match
  })
}

function resolveNode(node: TiptapNode, values: MergeValues): TiptapNode {
  if (node.type === "mergeTag") {
    // TipTap uses attrs, BlockNote uses props
    const a = node.attrs ?? (node as Record<string, unknown>).props as Record<string, unknown> | undefined
    const name = (a?.name as string) ?? ""
    const resolved = values[name] ?? `{{${a?.label ?? name}}}`
    return { type: "text", text: resolved }
  }

  if (node.type === "text" && node.text && /\{\{[^}]+\}\}/.test(node.text)) {
    return { ...node, text: resolveTextMergeTags(node.text, values) }
  }

  if (Array.isArray(node.content)) {
    return { ...node, content: node.content.map((child) => resolveNode(child, values)) }
  }

  return node
}

function extractHtmlEmbeds(node: TiptapNode): { cleaned: TiptapNode; embeds: string[] } {
  const embeds: string[] = []

  if (!Array.isArray(node.content)) return { cleaned: node, embeds }

  const filteredContent: TiptapNode[] = []
  for (const child of node.content) {
    if (child.type === "htmlEmbed") {
      const html = (child.attrs?.html as string) ?? ""
      if (html) embeds.push(html)
    } else {
      const result = extractHtmlEmbeds(child)
      filteredContent.push(result.cleaned)
      embeds.push(...result.embeds)
    }
  }

  return { cleaned: { ...node, content: filteredContent }, embeds }
}

// ─── Shared email-safe HTML wrapper ──────────────────────────────────────────

export type EmailStyleOptions = {
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

function buildEmailDocument(innerHtml: string, styles?: EmailStyleOptions): string {
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
              ${innerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Generate email-safe HTML from resolved Tiptap JSON ──────────────────────

/**
 * Takes a raw Tiptap JSON document (as stored in Liveblocks / email_templates.editor_json),
 * substitutes all mergeTag nodes with their resolved values, and returns email-safe HTML.
 */
export function renderTemplate(
  editorJson: Record<string, unknown>,
  values: MergeValues,
  styles?: EmailStyleOptions
): string {
  const resolved = resolveNode(editorJson as TiptapNode, values)
  const { cleaned, embeds } = extractHtmlEmbeds(resolved)

  const bodyHtml = generateHTML(cleaned as Parameters<typeof generateHTML>[0], [StarterKit])
  const embedHtml = embeds.join("\n")
  const innerHtml = `${bodyHtml}${embedHtml ? `\n${embedHtml}` : ""}`

  return buildEmailDocument(innerHtml, styles)
}

/**
 * Wraps raw HTML (e.g. from BlockNote's blocksToHTMLLossy) in an
 * email-safe document structure with table layout and inline styles.
 */
export function wrapEmailHtml(
  bodyHtml: string,
  styles?: EmailStyleOptions
): string {
  return buildEmailDocument(bodyHtml, styles)
}

/**
 * Converts HTML to a readable plaintext fallback for the text/plain MIME part.
 * Preserves links as "text (url)", turns <br>/<p>/<div> into line breaks,
 * and collapses excessive whitespace.
 */
export function htmlToPlaintext(html: string): string {
  let text = html

  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")

  text = text.replace(/<br\s*\/?>/gi, "\n")
  text = text.replace(/<\/p>/gi, "\n\n")
  text = text.replace(/<\/(div|tr|li|blockquote)>/gi, "\n")
  text = text.replace(/<\/h[1-6]>/gi, "\n\n")
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n")
  text = text.replace(/<li[^>]*>/gi, "  - ")

  text = text.replace(
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href: string, label: string) => {
      const cleanLabel = label.replace(/<[^>]+>/g, "").trim()
      if (!cleanLabel || cleanLabel === href) return href
      return `${cleanLabel} (${href})`
    }
  )

  text = text.replace(/<img[^>]+alt=["']([^"']+)["'][^>]*>/gi, "[image: $1]")
  text = text.replace(/<img[^>]*>/gi, "")

  text = text.replace(/<[^>]+>/g, "")

  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, "")

  text = text.replace(/[ \t]+/g, " ")
  text = text.replace(/\n[ \t]+/g, "\n")
  text = text.replace(/\n{3,}/g, "\n\n")
  text = text.trim()

  return text
}
