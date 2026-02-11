"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@repo/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  category: string;
  dropdown_options?: string[] | null;
}

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  inputs: InputField[];
  className?: string;
  placeholder?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers – serialization                                                    */
/* -------------------------------------------------------------------------- */

/** Segments: either plain text or an input reference `{input_id}` */
type Segment =
  | { type: "text"; value: string }
  | { type: "input"; inputId: string };

/** Parse a stored expression string into segments */
function parseExpression(expr: string): Segment[] {
  if (!expr) return [{ type: "text", value: "" }];
  const segments: Segment[] = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(expr)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: expr.slice(lastIndex, match.index) });
    }
    segments.push({ type: "input", inputId: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < expr.length) {
    segments.push({ type: "text", value: expr.slice(lastIndex) });
  }
  if (segments.length === 0) {
    segments.push({ type: "text", value: "" });
  }
  return segments;
}

/** Serialize segments back to string */
function serializeSegments(segments: Segment[]): string {
  return segments
    .map((s) => (s.type === "input" ? `{${s.inputId}}` : s.value))
    .join("");
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ExpressionInput({
  value,
  onChange,
  inputs,
  className,
  placeholder = "Type expression... use @ to reference inputs",
}: ExpressionInputProps) {
  const [segments, setSegments] = useState<Segment[]>(() =>
    parseExpression(value)
  );
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  /** Which text-segment index currently has the @ trigger */
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    const current = serializeSegments(segments);
    if (value !== current) {
      setSegments(parseExpression(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Emit changes
  const emitChange = useCallback(
    (newSegments: Segment[]) => {
      setSegments(newSegments);
      onChange(serializeSegments(newSegments));
    },
    [onChange]
  );

  // Filtered input list
  const filteredInputs = mentionQuery
    ? inputs.filter(
        (inp) =>
          inp.id.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          inp.input_label.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : inputs;

  // Get the "editable" text value — the last text segment's value
  const getEditableText = (): { segmentIndex: number; text: string } => {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].type === "text") {
        return { segmentIndex: i, text: segments[i].value };
      }
    }
    // No text segment; add one
    return { segmentIndex: -1, text: "" };
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const { segmentIndex } = getEditableText();

    // Check for @ trigger
    const atIndex = newValue.lastIndexOf("@");
    if (atIndex !== -1) {
      const query = newValue.slice(atIndex + 1);
      setMentionQuery(query);
      setShowMentions(true);
      setSelectedMentionIndex(0);
      setActiveSegmentIndex(
        segmentIndex >= 0 ? segmentIndex : segments.length
      );
    } else {
      setShowMentions(false);
      setMentionQuery("");
      setActiveSegmentIndex(null);
    }

    // Update the last text segment (or add one)
    if (segmentIndex >= 0) {
      const newSegments = [...segments];
      newSegments[segmentIndex] = { type: "text", value: newValue };
      emitChange(newSegments);
    } else {
      emitChange([...segments, { type: "text", value: newValue }]);
    }
  };

  const selectMention = useCallback(
    (inp: InputField) => {
      const { segmentIndex, text } = getEditableText();
      const atIndex = text.lastIndexOf("@");
      if (atIndex === -1) return;

      // Text before @
      const before = text.slice(0, atIndex);
      const newSegments = [...segments];

      if (segmentIndex >= 0) {
        // Replace existing text segment: text before @ + input chip + empty text after
        newSegments.splice(
          segmentIndex,
          1,
          ...[
            before ? { type: "text" as const, value: before } : null,
            { type: "input" as const, inputId: inp.id },
            { type: "text" as const, value: "" },
          ].filter(Boolean) as Segment[]
        );
      } else {
        newSegments.push(
          { type: "input", inputId: inp.id },
          { type: "text", value: "" }
        );
      }

      emitChange(newSegments);
      setShowMentions(false);
      setMentionQuery("");
      setActiveSegmentIndex(null);

      // Refocus the input
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, emitChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredInputs.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredInputs.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredInputs.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredInputs[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Backspace on empty input: remove last input chip
    if (e.key === "Backspace") {
      const { text } = getEditableText();
      if (text === "" && segments.length > 1) {
        // Find the last input segment and remove it
        const newSegments = [...segments];
        for (let i = newSegments.length - 1; i >= 0; i--) {
          if (newSegments[i].type === "input") {
            newSegments.splice(i, 1);
            break;
          }
        }
        emitChange(newSegments);
      }
    }
  };

  const removeChip = (segmentIndex: number) => {
    const newSegments = segments.filter((_, i) => i !== segmentIndex);
    if (
      newSegments.length === 0 ||
      newSegments.every((s) => s.type === "input")
    ) {
      newSegments.push({ type: "text", value: "" });
    }
    emitChange(newSegments);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const getInputLabel = (inputId: string): string => {
    const inp = inputs.find((i) => i.id === inputId);
    return inp ? inp.input_label : inputId;
  };

  // Close mentions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const editableText = getEditableText().text;
  const isEmpty =
    segments.length <= 1 &&
    segments[0]?.type === "text" &&
    !segments[0]?.value;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-[32px] w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs transition-colors",
          "focus-within:border-foreground/50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {segments.map((seg, i) => {
          if (seg.type === "input") {
            return (
              <span
                key={`chip-${i}`}
                className="inline-flex items-center gap-0.5 rounded border border-blue-500 bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 shrink-0"
              >
                {getInputLabel(seg.inputId)}
                <button
                  type="button"
                  className="ml-0.5 rounded-sm opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(i);
                  }}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          }
          return null; // Text segments are handled by the input below
        })}
        <input
          ref={inputRef}
          type="text"
          value={editableText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow clicking on suggestions
            setTimeout(() => setShowMentions(false), 150);
          }}
          placeholder={isEmpty ? placeholder : ""}
          className="flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-muted-foreground text-xs"
          autoComplete="off"
        />
      </div>

      {/* Mentions dropdown */}
      {showMentions && filteredInputs.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        >
          <ul className="max-h-40 overflow-auto">
            {filteredInputs.map((inp, idx) => (
              <li key={inp.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full cursor-pointer rounded-sm px-2 py-1 text-left text-xs hover:bg-muted",
                    idx === selectedMentionIndex && "bg-muted"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectMention(inp);
                  }}
                >
                  <span className="font-medium">{inp.input_label}</span>
                  <span className="ml-2 text-muted-foreground">
                    {inp.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
