/**
 * Bidirectional message format converter:
 * Liveblocks body JSON <-> Slack mrkdwn <-> Teams HTML
 *
 * Handles: bold, italic, strikethrough, code, links, mentions
 */

// ─── Types ───────────────────────────────────────────────────────────

/** Liveblocks comment body format */
interface LiveblocksBody {
  version: 1;
  content: LiveblocksParagraph[];
}

interface LiveblocksParagraph {
  type: "paragraph";
  children: LiveblocksInline[];
}

type LiveblocksInline =
  | LiveblocksText
  | LiveblocksMention
  | LiveblocksLink;

interface LiveblocksText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

interface LiveblocksMention {
  type: "mention";
  id: string;
}

interface LiveblocksLink {
  type: "link";
  url: string;
  text?: string;
}

// ─── Liveblocks to Slack mrkdwn ─────────────────────────────────────

export function liveblocksToSlack(body: LiveblocksBody): string {
  return body.content
    .map((paragraph) => {
      return paragraph.children
        .map((child) => {
          if ("type" in child) {
            if (child.type === "mention") {
              return `<@${child.id}>`;
            }
            if (child.type === "link") {
              return `<${child.url}|${child.text ?? child.url}>`;
            }
          }

          const textChild = child as LiveblocksText;
          let text = textChild.text;

          if (textChild.code) text = "`" + text + "`";
          if (textChild.bold) text = "*" + text + "*";
          if (textChild.italic) text = "_" + text + "_";
          if (textChild.strikethrough) text = "~" + text + "~";

          return text;
        })
        .join("");
    })
    .join("\n");
}

// ─── Slack mrkdwn to Liveblocks ─────────────────────────────────────

export function slackToLiveblocks(mrkdwn: string): LiveblocksBody {
  const paragraphs = mrkdwn.split("\n");

  return {
    version: 1,
    content: paragraphs.map((para) => ({
      type: "paragraph" as const,
      children: parseSlackInline(para),
    })),
  };
}

function parseSlackInline(text: string): LiveblocksInline[] {
  const children: LiveblocksInline[] = [];

  // Simple regex-based parsing for Slack formatting
  const regex =
    /(<@([^>]+)>)|(<([^|>]+)\|([^>]+)>)|(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(`([^`]+)`)|([^<*_~`]+)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      children.push({ type: "mention", id: match[2] });
    } else if (match[3]) {
      children.push({ type: "link", url: match[4], text: match[5] });
    } else if (match[6]) {
      children.push({ text: match[7], bold: true });
    } else if (match[8]) {
      children.push({ text: match[9], italic: true });
    } else if (match[10]) {
      children.push({ text: match[11], strikethrough: true });
    } else if (match[12]) {
      children.push({ text: match[13], code: true });
    } else if (match[14]) {
      children.push({ text: match[14] });
    }
  }

  if (children.length === 0) {
    children.push({ text });
  }

  return children;
}

// ─── Liveblocks to Teams HTML ────────────────────────────────────────

export function liveblocksToTeams(body: LiveblocksBody): string {
  const paragraphs = body.content.map((paragraph) => {
    const html = paragraph.children
      .map((child) => {
        if ("type" in child) {
          if (child.type === "mention") {
            return `<at>${child.id}</at>`;
          }
          if (child.type === "link") {
            return `<a href="${escapeHtml(child.url)}">${escapeHtml(child.text ?? child.url)}</a>`;
          }
        }

        const textChild = child as LiveblocksText;
        let text = escapeHtml(textChild.text);

        if (textChild.code) text = `<code>${text}</code>`;
        if (textChild.bold) text = `<strong>${text}</strong>`;
        if (textChild.italic) text = `<em>${text}</em>`;
        if (textChild.strikethrough) text = `<s>${text}</s>`;

        return text;
      })
      .join("");

    return `<p>${html}</p>`;
  });

  return paragraphs.join("");
}

// ─── Teams HTML to Liveblocks ────────────────────────────────────────

export function teamsToLiveblocks(html: string): LiveblocksBody {
  // Strip HTML tags and convert to plain text paragraphs
  const stripped = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<strong>([^<]+)<\/strong>/gi, "$1")
    .replace(/<em>([^<]+)<\/em>/gi, "$1")
    .replace(/<s>([^<]+)<\/s>/gi, "$1")
    .replace(/<code>([^<]+)<\/code>/gi, "$1")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2")
    .replace(/<at>([^<]+)<\/at>/gi, "@$1")
    .replace(/<[^>]+>/g, "")
    .trim();

  const paragraphs = stripped.split("\n").filter((p) => p.trim());

  return {
    version: 1,
    content: paragraphs.map((para) => ({
      type: "paragraph" as const,
      children: [{ text: para.trim() }],
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extract plain text from a Liveblocks body (for notifications, previews)
 */
export function liveblocksToPlainText(body: LiveblocksBody): string {
  return body.content
    .map((paragraph) =>
      paragraph.children
        .map((child) => {
          if ("type" in child) {
            if (child.type === "mention") return `@${child.id}`;
            if (child.type === "link") return child.text ?? child.url;
          }
          return (child as LiveblocksText).text;
        })
        .join("")
    )
    .join("\n");
}
