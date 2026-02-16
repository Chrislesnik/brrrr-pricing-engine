"use client";

import MonacoEditor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { useAtom } from "jotai";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { vercelDarkTheme } from "@/components/workflow-builder/lib/monaco-theme";
import { edgesAtom, nodesAtom } from "@/components/workflow-builder/lib/workflow-store";
import { buildTemplateOptions } from "./template-helpers";

let jsCompletionsRegistered = false;

// CSS class name injected once for template token decorations
const TEMPLATE_DECORATION_CLASS = "wf-template-token";
let decorationStyleInjected = false;

function injectDecorationStyle() {
  if (decorationStyleInjected) return;
  decorationStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .${TEMPLATE_DECORATION_CLASS} {
      background: rgba(59, 130, 246, 0.12);
      border-radius: 3px;
      padding: 0 1px;
    }
    .vs-dark .${TEMPLATE_DECORATION_CLASS},
    .hc-black .${TEMPLATE_DECORATION_CLASS} {
      background: rgba(96, 165, 250, 0.18);
    }
  `;
  document.head.appendChild(style);
}

export interface CodeEditorProps extends EditorProps {
  currentNodeId?: string;
}

export function CodeEditor({ currentNodeId, ...props }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const disposableRef = useRef<{ dispose: () => void } | null>(null);
  const templateDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);

  // Keep latest values in refs so the Monaco provider callback always sees current data
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const currentNodeIdRef = useRef(currentNodeId);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  currentNodeIdRef.current = currentNodeId;

  // Update template decorations whenever editor content changes
  const updateDecorations = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const pattern = /\{\{@[^}]+\}\}/g;
    const newDecorations: Array<{
      range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
      options: { inlineClassName: string };
    }> = [];

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      newDecorations.push({
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        options: { inlineClassName: TEMPLATE_DECORATION_CLASS },
      });
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  };

  // Re-run decorations when nodes/edges change (label updates could affect display)
  useEffect(() => {
    updateDecorations();
  }, [nodes, edges]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("vercel-dark", vercelDarkTheme);
    monaco.editor.setTheme(resolvedTheme === "dark" ? "vercel-dark" : "light");

    // Register workflow Code node completions (once globally for JS)
    if (!jsCompletionsRegistered && props.defaultLanguage === "javascript") {
      jsCompletionsRegistered = true;
      disposableRef.current = monaco.languages.registerCompletionItemProvider("javascript", {
        triggerCharacters: ["$", "."],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const lineContent = model.getLineContent(position.lineNumber);
          const textBefore = lineContent.substring(0, position.column - 1);

          const suggestions: Array<{
            label: string;
            kind: number;
            insertText: string;
            detail?: string;
            documentation?: string;
            range: typeof range;
          }> = [];

          if (textBefore.endsWith("$input.") || textBefore.endsWith("$input")) {
            if (textBefore.endsWith("$input.")) {
              suggestions.push(
                { label: "all()", kind: monaco.languages.CompletionItemKind.Method, insertText: "all()", detail: "() => Item[]", documentation: "Returns all input items", range },
                { label: "first()", kind: monaco.languages.CompletionItemKind.Method, insertText: "first()", detail: "() => Item", documentation: "Returns the first input item", range },
                { label: "last()", kind: monaco.languages.CompletionItemKind.Method, insertText: "last()", detail: "() => Item", documentation: "Returns the last input item", range },
                { label: "item", kind: monaco.languages.CompletionItemKind.Property, insertText: "item", detail: "Item", documentation: "The current item (alias for first())", range },
              );
            } else {
              suggestions.push(
                { label: "$input", kind: monaco.languages.CompletionItemKind.Variable, insertText: "$input", detail: "InputHelper", documentation: "Access input data from the previous node", range },
              );
            }
          }

          if (textBefore.endsWith("$") || (!textBefore.endsWith("$input") && !textBefore.endsWith("$node"))) {
            suggestions.push(
              { label: "$input", kind: monaco.languages.CompletionItemKind.Variable, insertText: "$input", detail: "InputHelper", documentation: "Access input data from the previous node. Use .all(), .first(), .last()", range },
              { label: "$node", kind: monaco.languages.CompletionItemKind.Variable, insertText: "$node['']", detail: "NodeProxy", documentation: "Access any upstream node by name: $node['NodeName'].json.field", range },
            );
          }

          if (textBefore.endsWith("console.")) {
            suggestions.push(
              { label: "log()", kind: monaco.languages.CompletionItemKind.Method, insertText: "log()", detail: "(...args) => void", documentation: "Log output (captured in step logs)", range },
              { label: "warn()", kind: monaco.languages.CompletionItemKind.Method, insertText: "warn()", detail: "(...args) => void", documentation: "Log warning", range },
              { label: "error()", kind: monaco.languages.CompletionItemKind.Method, insertText: "error()", detail: "(...args) => void", documentation: "Log error", range },
            );
          }

          if (textBefore.match(/\.(json|item)\s*$/)) {
            suggestions.push(
              { label: "json", kind: monaco.languages.CompletionItemKind.Property, insertText: "json", detail: "Record<string, unknown>", documentation: "The item's data object", range },
            );
          }

          return { suggestions };
        },
      });
    }

    // Register @-triggered template completions for non-JS languages when a node context is available
    if (currentNodeIdRef.current && props.defaultLanguage !== "javascript") {
      const language = props.defaultLanguage || "json";
      templateDisposableRef.current = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ["@"],
        provideCompletionItems: (model, position) => {
          const nodeId = currentNodeIdRef.current;
          if (!nodeId) return { suggestions: [] };

          const lineContent = model.getLineContent(position.lineNumber);
          const textBefore = lineContent.substring(0, position.column - 1);

          // Only trigger when the user just typed @ (not in the middle of a word unrelated to @)
          const lastAtIdx = textBefore.lastIndexOf("@");
          if (lastAtIdx === -1) return { suggestions: [] };

          const filterText = textBefore.substring(lastAtIdx + 1);
          // If there's a space or newline after @ it's no longer a reference
          if (/[\s\n]/.test(filterText)) return { suggestions: [] };

          const options = buildTemplateOptions(nodeId, nodesRef.current, edgesRef.current);

          const replaceRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: lastAtIdx + 1, // start at the @
            endColumn: position.column,
          };

          return {
            suggestions: options.map((opt) => ({
              label: opt.field ? `${opt.nodeName}.${opt.field}` : opt.nodeName,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: opt.template,
              detail: opt.description || (opt.type === "node" ? "Node output" : undefined),
              documentation: `Inserts ${opt.template}`,
              range: replaceRange,
              filterText: `@${opt.nodeName}${opt.field ? `.${opt.field}` : ""}`,
              sortText: `0-${opt.nodeName}-${opt.field || ""}`,
            })),
          };
        },
      });
    }

    // Set up decorations for template tokens
    injectDecorationStyle();
    updateDecorations();
    editor.onDidChangeModelContent(() => updateDecorations());

    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  // Cleanup providers on unmount
  useEffect(() => {
    return () => {
      templateDisposableRef.current?.dispose();
    };
  }, []);

  return (
    <MonacoEditor
      {...props}
      onMount={handleEditorMount}
      theme={resolvedTheme === "dark" ? "vercel-dark" : "light"}
    />
  );
}
