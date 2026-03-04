"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  columns: { name: string; type: string }[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * A plain text input with @-autocomplete and a styled tag preview.
 *
 * The input behaves like a normal text field -- full cursor movement,
 * selection, typing, deleting, etc. Typing `@` triggers an autocomplete
 * dropdown. Below the input, a preview strip renders recognized
 * @column_name references as styled inline tags.
 *
 * Example stored value: `@first_name @last_name`
 */
export function ColumnExpressionInput({
  value,
  onChange,
  columns,
  loading = false,
  placeholder = "Type @ to insert columns...",
  className,
}: ColumnExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState("");
  const [atStartPos, setAtStartPos] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const columnNames = useMemo(() => new Set(columns.map((c) => c.name)), [columns]);
  const columnTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) map.set(col.name, col.type);
    return map;
  }, [columns]);

  const filteredColumns = useMemo(() => {
    return columns.filter((col) =>
      col.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [columns, filter]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  const insertColumn = useCallback(
    (colName: string) => {
      if (atStartPos === null) return;
      const input = inputRef.current;
      if (!input) return;

      const cursorPos = input.selectionStart ?? value.length;
      const before = value.slice(0, atStartPos);
      const after = value.slice(cursorPos);
      const insertion = `@${colName} `;
      const newValue = before + insertion + after;

      onChange(newValue);
      setShowSuggestions(false);
      setFilter("");
      setAtStartPos(null);

      requestAnimationFrame(() => {
        input.focus();
        const newPos = before.length + insertion.length;
        input.setSelectionRange(newPos, newPos);
      });
    },
    [value, onChange, atStartPos]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? newValue.length;
      onChange(newValue);

      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex >= 0) {
        const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
        if (!/\s/.test(afterAt)) {
          setAtStartPos(lastAtIndex);
          setFilter(afterAt);
          setShowSuggestions(true);
          return;
        }
      }

      setShowSuggestions(false);
      setFilter("");
      setAtStartPos(null);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || filteredColumns.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredColumns.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredColumns.length - 1));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertColumn(filteredColumns[selectedIndex].name);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, filteredColumns, selectedIndex, insertColumn]
  );

  /** Build a preview of the expression with styled tags. */
  const preview = useMemo(() => {
    if (!value) return null;

    const parts: React.ReactNode[] = [];
    const regex = /@(\w+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        const text = value.slice(lastIndex, match.index);
        if (text.trim()) {
          parts.push(
            <span key={key++} className="text-muted-foreground">
              {text.trim()}
            </span>
          );
        }
      }

      const colName = match[1];
      if (columnNames.has(colName)) {
        parts.push(
          <span
            key={key++}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.5 text-[11px] font-medium font-mono"
          >
            {colName}
            {columnTypeMap.has(colName) && (
              <span className="text-[9px] font-normal text-indigo-400 dark:text-indigo-500">
                {columnTypeMap.get(colName)}
              </span>
            )}
          </span>
        );
      } else {
        parts.push(
          <span key={key++} className="text-muted-foreground">
            @{colName}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < value.length) {
      const text = value.slice(lastIndex);
      if (text.trim()) {
        parts.push(
          <span key={key++} className="text-muted-foreground">
            {text.trim()}
          </span>
        );
      }
    }

    return parts.length > 0 ? parts : null;
  }, [value, columnNames, columnTypeMap]);

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {/* Normal text input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "placeholder:text-muted-foreground",
          className
        )}
        autoComplete="off"
      />

      {/* Tag preview strip */}
      {preview && (
        <div className="flex flex-wrap items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground/60 mr-0.5">Preview:</span>
          {preview}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto" style={{ top: "2rem" }}>
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading columns...
            </div>
          ) : filteredColumns.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No matching columns
            </div>
          ) : (
            filteredColumns.map((col, idx) => (
              <button
                key={col.name}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  idx === selectedIndex && "bg-accent text-accent-foreground"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertColumn(col.name);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="font-mono text-xs">@{col.name}</span>
                <span className="text-[10px] text-muted-foreground">{col.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
