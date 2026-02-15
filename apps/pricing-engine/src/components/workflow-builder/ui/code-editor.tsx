"use client";

import MonacoEditor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { vercelDarkTheme } from "@/components/workflow-builder/lib/monaco-theme";

let jsCompletionsRegistered = false;

export function CodeEditor(props: EditorProps) {
  const { resolvedTheme } = useTheme();
  const disposableRef = useRef<{ dispose: () => void } | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme("vercel-dark", vercelDarkTheme);
    monaco.editor.setTheme(resolvedTheme === "dark" ? "vercel-dark" : "light");

    // Register workflow Code node completions (once globally)
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

          // Get text before cursor for context
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

          // $input completions
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

          // Top-level $ completions
          if (textBefore.endsWith("$") || (!textBefore.endsWith("$input") && !textBefore.endsWith("$node"))) {
            suggestions.push(
              { label: "$input", kind: monaco.languages.CompletionItemKind.Variable, insertText: "$input", detail: "InputHelper", documentation: "Access input data from the previous node. Use .all(), .first(), .last()", range },
              { label: "$node", kind: monaco.languages.CompletionItemKind.Variable, insertText: "$node['']", detail: "NodeProxy", documentation: "Access any upstream node by name: $node['NodeName'].json.field", range },
            );
          }

          // console completions
          if (textBefore.endsWith("console.")) {
            suggestions.push(
              { label: "log()", kind: monaco.languages.CompletionItemKind.Method, insertText: "log()", detail: "(...args) => void", documentation: "Log output (captured in step logs)", range },
              { label: "warn()", kind: monaco.languages.CompletionItemKind.Method, insertText: "warn()", detail: "(...args) => void", documentation: "Log warning", range },
              { label: "error()", kind: monaco.languages.CompletionItemKind.Method, insertText: "error()", detail: "(...args) => void", documentation: "Log error", range },
            );
          }

          // .json completions after item/node references
          if (textBefore.match(/\.(json|item)\s*$/)) {
            suggestions.push(
              { label: "json", kind: monaco.languages.CompletionItemKind.Property, insertText: "json", detail: "Record<string, unknown>", documentation: "The item's data object", range },
            );
          }

          return { suggestions };
        },
      });
    }

    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  return (
    <MonacoEditor
      {...props}
      onMount={handleEditorMount}
      theme={resolvedTheme === "dark" ? "vercel-dark" : "light"}
    />
  );
}

