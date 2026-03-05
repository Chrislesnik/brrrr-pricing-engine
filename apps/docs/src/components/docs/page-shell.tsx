import { cn } from "@repo/lib/cn";
import type { ReactNode } from "react";
import { ActiveToc } from "./active-toc";

interface PageShellProps {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  toc?: { id: string; title: string; level: number }[];
}

export function PageShell({
  title,
  description,
  badge,
  children,
  toc,
}: PageShellProps) {
  return (
    <div className="flex w-full flex-1 gap-8 px-4 py-8 md:px-8 lg:px-12">
      <article className="min-w-0 flex-1 max-w-3xl">
        {badge && (
          <span className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}

        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

        {description && (
          <p className="mt-2 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        )}

        <div className="mt-8 space-y-8">{children}</div>
      </article>

      {toc && toc.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-20 border-l-2 border-border pl-2">
            <ActiveToc toc={toc} />
          </div>
        </aside>
      )}
    </div>
  );
}

interface SectionProps {
  id?: string;
  title?: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      {title && (
        <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
          {title}
        </h2>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface CalloutProps {
  type?: "info" | "tip" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}

const CALLOUT_STYLES = {
  info: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
  tip: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  warning:
    "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  danger: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
} as const;

const CALLOUT_LABELS = {
  info: "Note",
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-4 px-4 py-3",
        CALLOUT_STYLES[type]
      )}
    >
      <p className="text-sm font-semibold mb-1">
        {title || CALLOUT_LABELS[type]}
      </p>
      <div className="text-sm text-foreground/80">{children}</div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  title?: string;
  code: string;
}

export function CodeBlock({ language, title, code }: CodeBlockProps) {
  return (
    <div className="rounded-lg bg-[#0d1117] dark:bg-zinc-950 border border-zinc-800 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {title || language}
          </span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-zinc-300">{code}</code>
      </pre>
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  href,
}: FeatureCardProps) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "group rounded-lg border bg-card p-5 transition-all",
        href &&
          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Wrapper>
  );
}

interface VideoPlaceholderProps {
  title: string;
  duration?: string;
}

export function VideoPlaceholder({ title, duration }: VideoPlaceholderProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-5 w-5 text-primary"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
      <p className="text-sm font-medium">{title}</p>
      {duration && (
        <p className="mt-1 text-xs text-muted-foreground">{duration}</p>
      )}
    </div>
  );
}

interface ScreenshotDemoProps {
  src: string;
  alt: string;
  caption?: string;
}

export function ScreenshotDemo({ src, alt, caption }: ScreenshotDemoProps) {
  return (
    <figure className="group overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="border-t bg-muted/30 px-4 py-2.5 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

interface PropertyTableProps {
  properties: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
}

export function PropertyTable({ properties }: PropertyTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium">Property</th>
            <th className="px-4 py-2.5 text-left font-medium">Type</th>
            <th className="px-4 py-2.5 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop) => (
            <tr key={prop.name} className="border-b last:border-0">
              <td className="px-4 py-2.5">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {prop.name}
                </code>
                {prop.required && (
                  <span className="ml-1.5 text-[10px] font-medium text-amber-500">
                    required
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {prop.type}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
