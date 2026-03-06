#!/usr/bin/env tsx
/**
 * One-time BaseHub content export script.
 * Fetches all documentation items from BaseHub and converts
 * ProseMirror rich text JSON to MDX files with Mintlify frontmatter.
 *
 * Usage: BASEHUB_TOKEN=xxx tsx scripts/export-basehub.ts
 *
 * Output directories:
 *   docs/developer/exported/     (docs app content)
 *   docs/resources/exported/     (resources app content)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { basehub } from "basehub";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT_DIR = path.resolve(process.cwd());
const DOCS_OUTPUT = path.join(ROOT_DIR, "docs", "developer", "exported");
const RESOURCES_OUTPUT = path.join(
  ROOT_DIR,
  "docs",
  "resources",
  "exported"
);

const RESOURCES_ONLY_CATEGORIES = new Set([
  "Loan Programs",
  "Underwriting",
  "Lender Platform",
]);

const RESOURCES_DIR_MAP: Record<string, string> = {
  "Loan Programs": "loan-programs",
  Underwriting: "underwriting",
  "Lender Platform": "platform-guides",
  Documentation: ".",
  Root: ".",
};

const DOCS_DIR_MAP: Record<string, string> = {
  Documentation: ".",
  Root: ".",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface ProseMirrorNode {
  type: string;
  text?: string;
  marks?: ProseMirrorMark[];
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
}

interface DocItem {
  _id: string;
  _title: string;
  _slug: string;
  _sys: { slug: string };
  category: string;
  richText?: {
    json?: {
      content?: ProseMirrorNode[];
      toc?: unknown[];
    };
  };
}

// ---------------------------------------------------------------------------
// ProseMirror → MDX converter
// ---------------------------------------------------------------------------

function applyMarks(text: string, marks?: ProseMirrorMark[]): string {
  if (!marks || marks.length === 0) return text;

  let result = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
      case "strong":
        result = `**${result}**`;
        break;
      case "italic":
      case "em":
        result = `*${result}*`;
        break;
      case "code":
        result = `\`${result}\``;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "";
        result = `[${result}](${href})`;
        break;
      }
      case "strike":
      case "strikethrough":
        result = `~~${result}~~`;
        break;
      default:
        console.warn(`  [warn] Unknown mark type: "${mark.type}"`);
    }
  }
  return result;
}

function childrenToMdx(
  nodes: ProseMirrorNode[] | undefined,
  listDepth: number
): string {
  if (!nodes) return "";
  return nodes.map((n) => nodeToMdx(n, listDepth)).join("");
}

function renderListItem(
  item: ProseMirrorNode,
  bullet: string,
  depth: number
): string {
  const indent = "  ".repeat(depth);
  const children = item.content ?? [];
  const lines: string[] = [];

  for (const child of children) {
    if (child.type === "bulletList" || child.type === "orderedList") {
      lines.push(nodeToMdx(child, depth + 1));
    } else {
      const text = childrenToMdx(child.content, depth).trim();
      if (text) {
        if (lines.length === 0) {
          lines.push(`${indent}${bullet} ${text}\n`);
        } else {
          lines.push(`${indent}  ${text}\n`);
        }
      }
    }
  }

  return lines.join("");
}

function renderTable(node: ProseMirrorNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return "";

  const matrix: string[][] = [];
  for (const row of rows) {
    const cells: string[] = [];
    for (const cell of row.content ?? []) {
      cells.push(childrenToMdx(cell.content, 0).trim().replace(/\n/g, " "));
    }
    matrix.push(cells);
  }

  if (matrix.length === 0) return "";

  const colCount = Math.max(...matrix.map((r) => r.length));
  for (const row of matrix) {
    while (row.length < colCount) row.push("");
  }

  const colWidths = Array.from({ length: colCount }, (_, i) =>
    Math.max(3, ...matrix.map((row) => row[i]?.length ?? 0))
  );

  const formatRow = (cells: string[]) =>
    "| " + cells.map((c, i) => c.padEnd(colWidths[i]!)).join(" | ") + " |";

  const separator =
    "| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |";

  const lines: string[] = [];
  lines.push(formatRow(matrix[0]!));
  lines.push(separator);
  for (let i = 1; i < matrix.length; i++) {
    lines.push(formatRow(matrix[i]!));
  }

  return lines.join("\n");
}

function nodeToMdx(node: ProseMirrorNode, listDepth = 0): string {
  switch (node.type) {
    case "doc":
      return childrenToMdx(node.content, listDepth);

    case "text":
      return applyMarks(node.text ?? "", node.marks);

    case "paragraph":
      return childrenToMdx(node.content, listDepth) + "\n\n";

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const hashes = "#".repeat(level);
      return `${hashes} ${childrenToMdx(node.content, listDepth).trim()}\n\n`;
    }

    case "bulletList":
      return (
        (node.content ?? [])
          .map((item) => renderListItem(item, "-", listDepth))
          .join("") + (listDepth === 0 ? "\n" : "")
      );

    case "orderedList":
      return (
        (node.content ?? [])
          .map((item, i) => renderListItem(item, `${i + 1}.`, listDepth))
          .join("") + (listDepth === 0 ? "\n" : "")
      );

    case "listItem":
      return childrenToMdx(node.content, listDepth);

    case "blockquote": {
      const inner = childrenToMdx(node.content, listDepth).trim();
      return (
        inner
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    }

    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      const code = childrenToMdx(node.content, listDepth).trimEnd();
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }

    case "hardBreak":
      return "\n";

    case "horizontalRule":
      return "---\n\n";

    case "image": {
      const alt = (node.attrs?.alt as string) ?? "";
      const src = (node.attrs?.src as string) ?? "";
      return `![${alt}](${src})\n\n`;
    }

    case "table":
      return renderTable(node) + "\n\n";

    case "tableRow":
    case "tableHeader":
    case "tableCell":
      return childrenToMdx(node.content, listDepth);

    // Custom BaseHub blocks
    case "blockCodeSnippet": {
      const lang = (node.attrs?.language as string) ?? "";
      const code =
        (node.attrs?.code as string) ??
        childrenToMdx(node.content, listDepth).trimEnd();
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }

    case "blockImage": {
      const alt = (node.attrs?.alt as string) ?? "";
      const url =
        (node.attrs?.url as string) ?? (node.attrs?.src as string) ?? "";
      return `![${alt}](${url})\n\n`;
    }

    case "blockFile": {
      const fileName =
        (node.attrs?.fileName as string) ??
        (node.attrs?.name as string) ??
        "file";
      const url = (node.attrs?.url as string) ?? "";
      return `[${fileName}](${url})\n\n`;
    }

    case "blockVideo": {
      const url =
        (node.attrs?.url as string) ?? (node.attrs?.src as string) ?? "";
      return `<video src="${url}" controls />\n\n`;
    }

    case "blockAudio": {
      const url =
        (node.attrs?.url as string) ?? (node.attrs?.src as string) ?? "";
      return `<audio src="${url}" controls />\n\n`;
    }

    default: {
      console.warn(
        `  [warn] Unknown node type: "${node.type}" — rendered as HTML comment`
      );
      const fallback = childrenToMdx(node.content, listDepth);
      return `<!-- unknown node: ${node.type} -->\n${fallback}`;
    }
  }
}

// ---------------------------------------------------------------------------
// Frontmatter & MDX assembly
// ---------------------------------------------------------------------------

function extractFirstParagraph(
  content: ProseMirrorNode[] | undefined
): string {
  if (!content) return "";
  for (const node of content) {
    if (node.type === "paragraph") {
      return childrenToMdx(node.content, 0).trim();
    }
  }
  return "";
}

function buildMdx(item: DocItem): string {
  const description = extractFirstParagraph(item.richText?.json?.content);
  const escapedTitle = item._title.replace(/"/g, '\\"');
  const escapedDesc = description.replace(/"/g, '\\"').slice(0, 200);

  let frontmatter = `---\ntitle: "${escapedTitle}"\n`;
  if (escapedDesc) {
    frontmatter += `description: "${escapedDesc}"\n`;
  }
  frontmatter += "---\n\n";

  const content = item.richText?.json?.content;
  if (!content || content.length === 0) {
    return frontmatter;
  }

  const body = content.map((n) => nodeToMdx(n, 0)).join("");
  return frontmatter + body.trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.BASEHUB_TOKEN) {
    console.error("Error: BASEHUB_TOKEN environment variable is required.");
    console.error(
      "Usage: BASEHUB_TOKEN=xxx tsx scripts/export-basehub.ts [--dry-run]"
    );
    process.exit(1);
  }

  console.log(
    dryRun ? "=== DRY RUN ===" : "=== Exporting BaseHub content ==="
  );

  const client = basehub({ token: process.env.BASEHUB_TOKEN });
  const data = await client.query({
    documentation: {
      items: {
        _id: true,
        _title: true,
        _slug: true,
        _sys: { slug: true },
        category: true,
        richText: {
          json: {
            content: true,
            toc: true,
          },
        },
      },
    },
  });

  const items = data.documentation.items as DocItem[];
  console.log(`Fetched ${items.length} documentation items\n`);

  const slugTracker: Record<string, number> = {};
  let docsCount = 0;
  let resourcesCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (!item.richText) {
      console.warn(`  [skip] "${item._title}" — missing richText`);
      skippedCount++;
      continue;
    }

    const isResource = RESOURCES_ONLY_CATEGORIES.has(item.category);
    const baseDir = isResource ? RESOURCES_OUTPUT : DOCS_OUTPUT;
    const dirMap = isResource ? RESOURCES_DIR_MAP : DOCS_DIR_MAP;
    const subDir = dirMap[item.category] ?? ".";
    const outDir = subDir === "." ? baseDir : path.join(baseDir, subDir);

    let slug = item._slug.split("/").pop() ?? item._slug;
    const slugKey = `${outDir}/${slug}`;
    if (slugTracker[slugKey] != null) {
      slugTracker[slugKey]++;
      slug = `${slug}-${slugTracker[slugKey]}`;
    } else {
      slugTracker[slugKey] = 1;
    }

    const filePath = path.join(outDir, `${slug}.mdx`);
    const mdx = buildMdx(item);

    if (dryRun) {
      console.log(`  [dry-run] ${path.relative(ROOT_DIR, filePath)}`);
    } else {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(filePath, mdx, "utf-8");
      console.log(`  [written] ${path.relative(ROOT_DIR, filePath)}`);
    }

    if (isResource) resourcesCount++;
    else docsCount++;
  }

  console.log("\n=== Summary ===");
  console.log(`  Docs:      ${docsCount}`);
  console.log(`  Resources: ${resourcesCount}`);
  console.log(`  Skipped:   ${skippedCount}`);
  console.log(`  Total:     ${items.length}`);
  if (dryRun) console.log("  (dry run — no files written)");
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
