"use client";

import { useAtom } from "jotai";
import { GripVertical, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { Input } from "@repo/ui/shadcn/input";
import {
  edgesAtom,
  nodesAtom,
  selectedNodeAtom,
} from "@/components/workflow-builder/lib/workflow-store";
import { CodeEditor } from "./code-editor";
import {
  getCommonFields,
  getNodeDisplayName,
  getUpstreamNodes,
} from "./template-helpers";

export interface ExpressionEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  title?: string;
  readOnly?: boolean;
}

export function ExpressionEditorModal({
  open,
  onOpenChange,
  value,
  onChange,
  language = "json",
  title = "Expression Editor",
  readOnly = false,
}: ExpressionEditorModalProps) {
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const [selectedNodeId] = useAtom(selectedNodeAtom);
  const [search, setSearch] = useState("");
  const [internalValue, setInternalValue] = useState(value);

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal value when modal opens or external value changes
  useEffect(() => {
    if (open) {
      setInternalValue(value);
    }
  }, [open, value]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleEditorChange = useCallback(
    (v: string | undefined) => {
      const newVal = v ?? "";
      setInternalValue(newVal);
      onChange(newVal);
    },
    [onChange]
  );

  // Build grouped upstream node data
  const upstreamNodes = selectedNodeId
    ? getUpstreamNodes(selectedNodeId, nodes, edges)
    : [];

  const groupedNodes = upstreamNodes.map((node) => {
    const nodeName = getNodeDisplayName(node);
    const fields = getCommonFields(node);
    return { node, nodeName, fields };
  });

  // Filter by search
  const filteredGroups = search.trim()
    ? groupedNodes
        .map((group) => {
          const q = search.toLowerCase();
          const nameMatch = group.nodeName.toLowerCase().includes(q);
          const matchingFields = group.fields.filter(
            (f) =>
              f.field.toLowerCase().includes(q) ||
              (f.description && f.description.toLowerCase().includes(q))
          );
          if (nameMatch) return group;
          if (matchingFields.length > 0)
            return { ...group, fields: matchingFields };
          return null;
        })
        .filter(Boolean) as typeof groupedNodes
    : groupedNodes;

  // Handle drag-and-drop onto the Monaco editor
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const templateText = e.dataTransfer.getData("text/plain");
      if (!templateText || !editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;

      // Get the drop target position within the editor
      const target = editor.getTargetAtClientPoint(e.clientX, e.clientY);
      if (target?.position) {
        const pos = target.position;
        editor.executeEdits("drag-drop", [
          {
            range: new monaco.Range(
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column
            ),
            text: templateText,
          },
        ]);
        // Sync value after edit
        const newVal = editor.getModel()?.getValue() ?? "";
        setInternalValue(newVal);
        onChange(newVal);
        editor.focus();
      }
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle clicking a field chip to insert at cursor
  const handleFieldClick = useCallback(
    (template: string) => {
      if (!editorRef.current || !monacoRef.current) return;
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits("click-insert", [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: template,
          },
        ]);
        const newVal = editor.getModel()?.getValue() ?? "";
        setInternalValue(newVal);
        onChange(newVal);
        editor.focus();
      }
    },
    [onChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-[62vw] sm:max-w-[62vw] w-[62vw] h-[80vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left: Output fields panel */}
          <div className="w-[300px] shrink-0 flex flex-col min-h-0 bg-muted/30 border-r">
            <div className="px-3 py-2 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search fields..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1">
              {filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No upstream nodes found.
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={filteredGroups.map((g) => g.node.id)}>
                  {filteredGroups.map((group) => (
                    <AccordionItem
                      key={group.node.id}
                      value={group.node.id}
                      className="border-b-0"
                    >
                      <AccordionTrigger className="py-2 px-1 text-xs font-semibold hover:no-underline">
                        <span className="truncate">{group.nodeName}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 px-1">
                        <div className="space-y-1">
                          {group.fields.map((field) => {
                            const template = `{{@${group.node.id}:${group.nodeName}.${field.field}}}`;
                            return (
                              <div
                                key={field.field}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", template);
                                  e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => handleFieldClick(template)}
                                className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing hover:bg-accent/60 transition-colors group"
                                title={`Drag or click to insert ${field.field}`}
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-foreground truncate">
                                    {field.field}
                                  </div>
                                  {field.description && (
                                    <div className="text-muted-foreground text-[10px] truncate">
                                      {field.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>

          {/* Right: Monaco editor */}
          <div
            ref={containerRef}
            className="flex-1 min-w-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <CodeEditor
              currentNodeId={selectedNodeId ?? undefined}
              defaultLanguage={language}
              height="100%"
              value={internalValue}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                fontSize: 13,
                readOnly,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
