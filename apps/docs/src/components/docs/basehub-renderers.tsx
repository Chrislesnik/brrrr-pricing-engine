import type { ComponentProps, ReactNode } from "react";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { FileText, Image as ImageIcon, Video, Volume2, Database } from "lucide-react";

type BaseHubBlock = {
  __typename: string;
  [key: string]: unknown;
};

function toCodeLanguage(language?: string | null) {
  if (!language) return "plaintext";
  return String(language).toLowerCase();
}

function normalizeBlocks(blocks: unknown): BaseHubBlock[] {
  if (!blocks) return [];
  if (Array.isArray(blocks)) return blocks as BaseHubBlock[];
  if (typeof blocks === "string") {
    try {
      const parsed = JSON.parse(blocks);
      return Array.isArray(parsed) ? (parsed as BaseHubBlock[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getRichTextBlocks(rawBlocks: unknown) {
  return normalizeBlocks(rawBlocks);
}

export const richTextComponents = {
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="mt-0 scroll-mt-24 text-4xl font-semibold">{children}</h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="scroll-mt-24 text-2xl font-semibold">{children}</h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="scroll-mt-24 text-xl font-semibold">{children}</h3>
  ),
  p: ({ children }: { children: ReactNode }) => (
    <p className="leading-7 text-foreground/90">{children}</p>
  ),
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => <li className="my-1">{children}</li>,
  pre: (props: ComponentProps<"pre">) => <Pre {...props} />,
  code: (props: ComponentProps<"code">) => (
    <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props} />
  ),
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-2 pl-4 text-muted-foreground">{children}</blockquote>
  ),
  a: (props: ComponentProps<"a">) => (
    <a
      {...props}
      className="font-medium text-primary underline-offset-4 hover:underline"
    />
  ),
};

export const richTextBlocks = {
  BlockCodeSnippet: (block: any) => {
    const language = toCodeLanguage(block.language);
    return (
      <div className="not-prose my-6">
        <CodeBlock>
          <pre>
            <code className={`language-${language}`}>{block.code}</code>
          </pre>
        </CodeBlock>
      </div>
    );
  },
  BlockImage: (block: any) => {
    const alt = block.alt ?? block.fileName ?? "Image";
    return (
      <figure className="not-prose my-6">
        <ImageZoom
          src={block.url}
          alt={alt}
          width={block.width}
          height={block.height}
          className="rounded-lg border"
        />
        <figcaption className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          {alt}
        </figcaption>
      </figure>
    );
  },
  BlockFile: (block: any) => (
    <div className="not-prose my-6 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <a className="font-medium text-primary" href={block.url} target="_blank" rel="noreferrer">
          {block.fileName}
        </a>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {Math.round((block.fileSize ?? 0) / 1024)} KB
      </p>
    </div>
  ),
  BlockVideo: (block: any) => (
    <div className="not-prose my-6 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Video className="h-4 w-4 text-primary" />
        {block.fileName}
      </div>
      <video className="mt-3 w-full rounded-md" controls src={block.url} />
    </div>
  ),
  BlockAudio: (block: any) => (
    <div className="not-prose my-6 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Volume2 className="h-4 w-4 text-primary" />
        {block.fileName}
      </div>
      <audio className="mt-3 w-full" controls src={block.url} />
    </div>
  ),
  SupabaseStorageComponent: (block: any) => (
    <div className="not-prose my-6 rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {block.supabaseIcon ? (
          <span className="text-base">{block.supabaseIcon}</span>
        ) : (
          <Database className="h-4 w-4 text-primary" />
        )}
        {block._title ?? "Supabase Storage"}
      </div>
      {block.untitled?.code ? (
        <div className="mt-4">
          <CodeBlock>
            <pre>
              <code className="language-plaintext">{block.untitled.code}</code>
            </pre>
          </CodeBlock>
        </div>
      ) : null}
    </div>
  ),
};
