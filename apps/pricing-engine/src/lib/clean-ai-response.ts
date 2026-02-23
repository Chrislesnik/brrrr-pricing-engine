/**
 * Strips n8n agent tool-call metadata blocks from AI response text.
 *
 * n8n's AI agent sometimes embeds traces like:
 *   [Used tools: Tool: ..., Input: ..., Result: [{...}]]
 * before the actual answer. These contain nested brackets (JSON), so
 * we track bracket depth to find the matching close.
 */
export function cleanAiResponse(text: string): string {
  const marker = "[Used tools:"
  let result = text
  let idx = result.indexOf(marker)

  while (idx !== -1) {
    let depth = 0
    let endIdx = idx
    for (let i = idx; i < result.length; i++) {
      if (result[i] === "[") depth++
      else if (result[i] === "]") {
        depth--
        if (depth === 0) {
          endIdx = i + 1
          break
        }
      }
    }

    const before = result.slice(0, idx)
    const after = result.slice(endIdx)
    result = (before + " " + after).replace(/\s{2,}/g, " ").trim()
    idx = result.indexOf(marker)
  }

  return result.trim()
}
