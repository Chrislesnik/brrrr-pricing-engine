import type { MDXComponents } from "mdx/types";
import { Callout, ScreenshotDemo, CodeBlock } from "@/components/docs/page-shell";

export function getMDXComponents(overrides?: MDXComponents): MDXComponents {
  return {
    Callout,
    ScreenshotDemo,
    CodeBlock,
    ...overrides,
  };
}
