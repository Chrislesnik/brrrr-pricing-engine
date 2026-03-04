"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { HTMLPreview } from "./html-preview"

function RawHtmlBlockView({
  node,
  updateAttributes,
  selected,
}: {
  node: { attrs: { html: string } }
  updateAttributes: (attrs: Partial<{ html: string }>) => void
  selected: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(100)
  const [previewOpen, setPreviewOpen] = useState(false)

  const resizeIframe = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    const h = iframe.contentDocument.body.scrollHeight
    if (h > 0 && h !== height) setHeight(h)
  }, [height])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      resizeIframe()
      const observer = new MutationObserver(resizeIframe)
      if (iframe.contentDocument?.body) {
        observer.observe(iframe.contentDocument.body, { childList: true, subtree: true, attributes: true })
      }
      return () => observer.disconnect()
    }

    iframe.addEventListener("load", handleLoad)
    return () => iframe.removeEventListener("load", handleLoad)
  }, [resizeIframe])

  const srcDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:transparent}</style>
</head><body>${node.attrs.html}</body></html>`

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      <div
        className={`relative rounded border transition-colors ${
          selected ? "border-ring ring-1 ring-ring" : "border-transparent hover:border-border"
        }`}
      >
        {selected ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute right-2 top-2 z-10 rounded-md border border-border bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            Preview / Source
          </button>
        ) : null}
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="HTML block"
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ height: `${height}px`, pointerEvents: selected ? "auto" : "none" }}
        />
      </div>
      <HTMLPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        html={node.attrs.html || "<!-- Empty HTML -->"}
        title="Raw HTML Block"
      />
    </NodeViewWrapper>
  )
}

export const RawHtmlBlock = Node.create({
  name: "rawHtmlBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-raw-html]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-raw-html": "true" }),
      HTMLAttributes.html,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawHtmlBlockView as any)
  },
})
