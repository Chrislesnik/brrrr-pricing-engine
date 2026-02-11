"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
/*  Supported functions                                                        */
/* -------------------------------------------------------------------------- */

const EXPRESSION_FUNCTIONS = [
  { name: "TODAY", signature: "TODAY()", description: "Current date", params: [] },
  { name: "MAX", signature: "MAX(a, b, ...)", description: "Maximum value", params: ["a", "b", "..."] },
  { name: "MIN", signature: "MIN(a, b, ...)", description: "Minimum value", params: ["a", "b", "..."] },
  { name: "SUM", signature: "SUM(a, b, ...)", description: "Sum of values", params: ["a", "b", "..."] },
  { name: "AVG", signature: "AVG(a, b, ...)", description: "Average of values", params: ["a", "b", "..."] },
  { name: "ROUND", signature: "ROUND(value, decimals)", description: "Round to N decimals", params: ["value", "decimals"] },
  { name: "ROUNDUP", signature: "ROUNDUP(value, decimals)", description: "Round up", params: ["value", "decimals"] },
  { name: "ROUNDDOWN", signature: "ROUNDDOWN(value, decimals)", description: "Round down", params: ["value", "decimals"] },
  { name: "ABS", signature: "ABS(value)", description: "Absolute value", params: ["value"] },
  { name: "IF", signature: "IF(cond, true, false)", description: "Conditional", params: ["cond", "true", "false"] },
  { name: "DATEDIFF", signature: "DATEDIFF(d1, d2)", description: "Days between dates", params: ["d1", "d2"] },
  { name: "YEAR", signature: "YEAR(date)", description: "Extract year", params: ["date"] },
  { name: "MONTH", signature: "MONTH(date)", description: "Extract month", params: ["date"] },
  { name: "DAY", signature: "DAY(date)", description: "Extract day", params: ["date"] },
  { name: "POWER", signature: "POWER(base, exp)", description: "Exponentiation", params: ["base", "exp"] },
  { name: "PMT", signature: "PMT(rate, nper, pv)", description: "Payment calculation", params: ["rate", "nper", "pv"] },
] as const;

/** Map of function names (uppercase) for quick lookup */
const FUNCTION_MAP = new Map(
  EXPRESSION_FUNCTIONS.map((fn) => [fn.name, fn])
);

/** Characters allowed in formula free-text (letters allowed for function names + @ queries) */
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.+\-*/(),><=!@_]*$/;

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

/** Merge adjacent text segments and ensure at least one text segment exists */
function normalizeSegments(segs: Segment[]): Segment[] {
  const result: Segment[] = [];
  for (const seg of segs) {
    if (
      seg.type === "text" &&
      result.length > 0 &&
      result[result.length - 1].type === "text"
    ) {
      result[result.length - 1] = {
        type: "text",
        value: (result[result.length - 1] as { type: "text"; value: string }).value + seg.value,
      };
    } else {
      result.push({ ...seg });
    }
  }
  if (result.length === 0 || result.every((s) => s.type === "input")) {
    result.push({ type: "text", value: "" });
  }
  return result;
}

/** Find the index of the last text segment in a segment array */
function lastTextIndex(segs: Segment[]): number {
  for (let i = segs.length - 1; i >= 0; i--) {
    if (segs[i].type === "text") return i;
  }
  return 0;
}

/** Extract the last "word" from text (sequence of letters at the end, not preceded by @) */
function getTrailingWord(text: string): string {
  // Don't match if we're inside an @ mention query
  if (text.includes("@")) {
    const afterAt = text.slice(text.lastIndexOf("@"));
    // If there's an @ still active (no space after it closing it), skip function detection
    if (!/\s/.test(afterAt.slice(1))) return "";
  }
  const match = text.match(/([a-zA-Z]+)$/);
  return match ? match[1] : "";
}

/**
 * Detect if the cursor is inside a function call.
 * Scans backward from cursorPos to find the nearest unmatched `(`,
 * then checks if it's preceded by a known function name.
 * Returns { fn, paramIndex } or null.
 */
function detectActiveFunction(
  text: string,
  cursorPos: number
): { fn: (typeof EXPRESSION_FUNCTIONS)[number]; paramIndex: number } | null {
  let depth = 0;
  let openParenPos = -1;

  // Walk backward from cursor to find the nearest unmatched `(`
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ")") depth++;
    else if (ch === "(") {
      if (depth === 0) {
        openParenPos = i;
        break;
      }
      depth--;
    }
  }

  if (openParenPos < 0) return null;

  // Extract function name before the `(`
  const beforeParen = text.slice(0, openParenPos);
  const nameMatch = beforeParen.match(/([a-zA-Z]+)$/);
  if (!nameMatch) return null;

  const fnName = nameMatch[1].toUpperCase();
  const fn = FUNCTION_MAP.get(fnName);
  if (!fn || fn.params.length === 0) return null;

  // Count commas between openParen+1 and cursor (at depth 0) to get param index
  let commaCount = 0;
  let innerDepth = 0;
  for (let i = openParenPos + 1; i < cursorPos; i++) {
    const ch = text[i];
    if (ch === "(") innerDepth++;
    else if (ch === ")") innerDepth--;
    else if (ch === "," && innerDepth === 0) commaCount++;
  }

  // Clamp to last param for variadic functions
  const paramIndex = Math.min(commaCount, fn.params.length - 1);

  return { fn, paramIndex };
}

/* -------------------------------------------------------------------------- */
/*  Expression validation                                                      */
/* -------------------------------------------------------------------------- */

function validateExpression(expr: string): { valid: boolean; error?: string } {
  // Replace input references with a numeric placeholder (0) so they're treated as values
  const clean = expr.replace(/\{[^}]+\}/g, "0");

  // Empty or whitespace-only is fine (unused expression)
  if (!clean.trim()) return { valid: true };

  // 1. Mismatched parentheses
  let depth = 0;
  for (const ch of clean) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return { valid: false, error: "Unexpected closing parenthesis" };
  }
  if (depth > 0) return { valid: false, error: "Unclosed parenthesis" };

  // 2. Unknown function names — any word immediately before `(` must be known
  const fnCallRegex = /([a-zA-Z]+)\s*\(/g;
  let fnMatch: RegExpExecArray | null;
  while ((fnMatch = fnCallRegex.exec(clean)) !== null) {
    const name = fnMatch[1].toUpperCase();
    if (!FUNCTION_MAP.has(name)) {
      return { valid: false, error: `Unknown function: ${fnMatch[1]}` };
    }
  }

  // 3. Argument count check — count top-level args inside each function call
  const fnArgRegex = /([a-zA-Z]+)\s*\(/g;
  let argMatch: RegExpExecArray | null;
  while ((argMatch = fnArgRegex.exec(clean)) !== null) {
    const name = argMatch[1].toUpperCase();
    const fn = FUNCTION_MAP.get(name);
    if (!fn) continue; // already caught by step 2

    // Find the matching closing paren from the position after `(`
    const openIndex = argMatch.index + argMatch[0].length; // position right after `(`
    let parenDepth = 1;
    let closeIndex = -1;
    for (let j = openIndex; j < clean.length; j++) {
      if (clean[j] === "(") parenDepth++;
      else if (clean[j] === ")") parenDepth--;
      if (parenDepth === 0) {
        closeIndex = j;
        break;
      }
    }
    if (closeIndex === -1) continue; // mismatched paren, already caught by step 1

    const inner = clean.slice(openIndex, closeIndex).trim();

    // Count arguments: empty → 0 args; otherwise count top-level commas + 1
    let argCount = 0;
    if (inner.length > 0) {
      argCount = 1;
      let innerDepth = 0;
      for (const ch of inner) {
        if (ch === "(") innerDepth++;
        else if (ch === ")") innerDepth--;
        else if (ch === "," && innerDepth === 0) argCount++;
      }
    }

    const expected = fn.params.length;
    if (expected > 0 && argCount < expected) {
      return {
        valid: false,
        error: `${fn.name}() requires ${expected} argument${expected > 1 ? "s" : ""}, got ${argCount}`,
      };
    }
  }

  // 4. Stray text — letters outside of function calls are not allowed
  // Strip all function calls (word + parenthesized content) recursively,
  // then check if any letters remain
  let stripped = clean;
  // Iteratively remove innermost function calls: NAME(...) where ... has no parens
  // Replace with "0" (digit) so stripped result never re-triggers letter matches
  let changed = true;
  while (changed) {
    const before = stripped;
    stripped = stripped.replace(/[a-zA-Z]+\s*\([^()]*\)/g, "0");
    changed = stripped !== before;
  }
  // After stripping all function calls, any remaining letters are stray text
  const strayMatch = stripped.match(/[a-zA-Z]+/);
  if (strayMatch) {
    return {
      valid: false,
      error: `Unexpected text: "${strayMatch[0]}" — use functions, @inputs, numbers, and operators only`,
    };
  }

  // 5. Dangling @ mention (not resolved to an input reference)
  if (stripped.includes("@")) {
    return { valid: false, error: "Unresolved @ mention — select an input from the dropdown" };
  }

  // 6. Dangling operator at the end
  const trimmed = clean.trim();
  if (/[+\-*/,]$/.test(trimmed)) {
    return { valid: false, error: "Expression ends with an operator" };
  }

  return { valid: true };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ExpressionInput({
  value,
  onChange,
  inputs,
  className,
  placeholder = "e.g. @Loan Amount * 0.01 + ROUND(...)",
}: ExpressionInputProps) {
  const [segments, setSegments] = useState<Segment[]>(() =>
    parseExpression(value)
  );

  /* --- @ mention state --- */
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null
  );

  /* --- Function autocomplete state --- */
  const [functionQuery, setFunctionQuery] = useState("");
  const [showFunctions, setShowFunctions] = useState(false);
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState(0);

  /* --- Active function hint (signature with bolded param) --- */
  const [activeFunc, setActiveFunc] = useState<{
    fn: (typeof EXPRESSION_FUNCTIONS)[number];
    paramIndex: number;
  } | null>(null);

  /* --- Active editing segment index --- */
  const [editingIndex, setEditingIndex] = useState<number>(() =>
    lastTextIndex(parseExpression(value))
  );
  const pendingFocusRef = useRef<{ cursorPos?: number } | null>(null);

  /* --- Validation state --- */
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    const current = serializeSegments(segments);
    if (value !== current) {
      const newSegs = parseExpression(value);
      setSegments(newSegs);
      setEditingIndex(lastTextIndex(newSegs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Apply pending focus after render (when editingIndex changes)
  useEffect(() => {
    if (pendingFocusRef.current && inputRef.current) {
      inputRef.current.focus();
      if (pendingFocusRef.current.cursorPos !== undefined) {
        const pos = pendingFocusRef.current.cursorPos;
        inputRef.current.setSelectionRange(pos, pos);
      }
      pendingFocusRef.current = null;
    }
  });

  // Emit changes
  const emitChange = useCallback(
    (newSegments: Segment[]) => {
      setSegments(newSegments);
      onChange(serializeSegments(newSegments));
    },
    [onChange]
  );

  // Filtered input list for @ mentions
  const filteredInputs = mentionQuery
    ? inputs.filter(
        (inp) =>
          inp.id.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          inp.input_label.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : inputs;

  // Filtered function list
  const filteredFunctions = useMemo(() => {
    if (!functionQuery) return [];
    const q = functionQuery.toUpperCase();
    return EXPRESSION_FUNCTIONS.filter((fn) => fn.name.startsWith(q));
  }, [functionQuery]);

  // Get the "editable" text value — the segment at editingIndex
  const getEditableText = (): { segmentIndex: number; text: string } => {
    // Use editingIndex if it points to a valid text segment
    if (
      editingIndex >= 0 &&
      editingIndex < segments.length &&
      segments[editingIndex].type === "text"
    ) {
      return { segmentIndex: editingIndex, text: segments[editingIndex].value };
    }
    // Fallback: find the last text segment
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].type === "text") {
        return { segmentIndex: i, text: segments[i].value };
      }
    }
    return { segmentIndex: -1, text: "" };
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear validation error on any text change
    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }

    const rawValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? rawValue.length;

    // Sanitize: only allow formula-valid characters
    if (!ALLOWED_CHARS_REGEX.test(rawValue)) {
      return; // reject the keystroke
    }

    const newValue = rawValue;
    const { segmentIndex } = getEditableText();

    // Check for @ trigger using text up to the cursor position
    const textToCursor = newValue.slice(0, cursorPos);
    const atIndex = textToCursor.lastIndexOf("@");
    if (atIndex !== -1) {
      // Extract the query: text between @ and the cursor
      const query = textToCursor.slice(atIndex + 1);
      // @ is active if the query contains only word characters (no operators/parens between @ and cursor)
      const isQueryActive = /^[\w]*$/.test(query);

      if (isQueryActive) {
        setMentionQuery(query);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        setActiveSegmentIndex(
          segmentIndex >= 0 ? segmentIndex : segments.length
        );
        // Hide functions while @ is active
        setShowFunctions(false);
        setFunctionQuery("");
      } else {
        // @ query has been broken by a special char — not active
        setShowMentions(false);
        setMentionQuery("");
        setActiveSegmentIndex(null);
        detectFunction(newValue);
      }
    } else {
      setShowMentions(false);
      setMentionQuery("");
      setActiveSegmentIndex(null);
      // Check for function autocomplete
      detectFunction(newValue);
    }

    // Update the last text segment (or add one)
    let newSegments: Segment[];
    if (segmentIndex >= 0) {
      newSegments = [...segments];
      newSegments[segmentIndex] = { type: "text", value: newValue };
    } else {
      newSegments = [...segments, { type: "text", value: newValue }];
    }
    emitChange(newSegments);

    // Detect active function hint
    updateFunctionHint(newSegments, cursorPos);
  };

  /** Recompute the function signature hint based on current segments and cursor */
  const updateFunctionHint = (segs: Segment[], localCursor: number) => {
    const fullText = serializeSegments(segs);
    const { segmentIndex: editIdx } = getEditableText();
    const idx = editIdx >= 0 ? editIdx : segs.length - 1;
    let absCursor = localCursor;
    for (let i = 0; i < idx; i++) {
      const s = segs[i];
      absCursor += s.type === "input" ? `{${s.inputId}}`.length : s.value.length;
    }
    setActiveFunc(detectActiveFunction(fullText, absCursor));
  };

  /** Handle cursor movement (arrow keys, click) without text change */
  const handleCursorMove = () => {
    const el = inputRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart ?? el.value.length;
    updateFunctionHint(segments, cursorPos);
  };

  /** Detect if the trailing word matches a function prefix */
  const detectFunction = (text: string) => {
    const word = getTrailingWord(text);
    if (word.length >= 1) {
      const matches = EXPRESSION_FUNCTIONS.filter((fn) =>
        fn.name.startsWith(word.toUpperCase())
      );
      if (matches.length > 0) {
        setFunctionQuery(word);
        setShowFunctions(true);
        setSelectedFunctionIndex(0);
        return;
      }
    }
    setShowFunctions(false);
    setFunctionQuery("");
  };

  /** Select an @ mention */
  const selectMention = useCallback(
    (inp: InputField) => {
      const { segmentIndex, text } = getEditableText();
      const atIndex = text.lastIndexOf("@");
      if (atIndex === -1) return;

      // Text before the @ trigger
      const before = text.slice(0, atIndex);
      // Text after the @ + query (e.g. the closing ")" in "ROUND(@loan)")
      const queryLen = mentionQuery.length;
      const after = text.slice(atIndex + 1 + queryLen);

      const newSegments = [...segments];

      if (segmentIndex >= 0) {
        const insertParts: Segment[] = [];
        if (before) insertParts.push({ type: "text", value: before });
        insertParts.push({ type: "input", inputId: inp.id });
        insertParts.push({ type: "text", value: after || "" });
        newSegments.splice(segmentIndex, 1, ...insertParts);

        // Set editing index to the after-text segment
        const afterTextIdx = segmentIndex + insertParts.length - 1;
        setEditingIndex(afterTextIdx);
        pendingFocusRef.current = { cursorPos: 0 };
      } else {
        newSegments.push(
          { type: "input", inputId: inp.id },
          { type: "text", value: after || "" }
        );
        setEditingIndex(newSegments.length - 1);
        pendingFocusRef.current = { cursorPos: 0 };
      }

      emitChange(newSegments);
      setShowMentions(false);
      setMentionQuery("");
      setActiveSegmentIndex(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, mentionQuery, emitChange, editingIndex]
  );

  /** Select a function from autocomplete */
  const selectFunction = useCallback(
    (fn: (typeof EXPRESSION_FUNCTIONS)[number]) => {
      const { segmentIndex, text } = getEditableText();
      const trailingWord = getTrailingWord(text);
      if (!trailingWord) return;

      // Replace the partial word with the full function name + parens: FN()
      const before = text.slice(0, text.length - trailingWord.length);
      const insertion = fn.name + "()";
      const newText = before + insertion;
      // Cursor position: right before the closing paren
      const cursorPos = (before + fn.name + "(").length;

      if (segmentIndex >= 0) {
        const newSegments = [...segments];
        newSegments[segmentIndex] = { type: "text", value: newText };
        emitChange(newSegments);
      } else {
        emitChange([...segments, { type: "text", value: newText }]);
      }

      setShowFunctions(false);
      setFunctionQuery("");

      setTimeout(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, emitChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // --- Function autocomplete keyboard nav (takes priority if visible) ---
    if (showFunctions && filteredFunctions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedFunctionIndex((prev) =>
          prev < filteredFunctions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedFunctionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredFunctions.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectFunction(filteredFunctions[selectedFunctionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowFunctions(false);
        return;
      }
    }

    // --- @ mention keyboard nav ---
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

    // --- Arrow key navigation between segments ---
    const el = inputRef.current;
    if (el && e.key === "ArrowLeft" && el.selectionStart === 0 && el.selectionEnd === 0) {
      // Find the previous text segment (skip over chips)
      for (let i = editingIndex - 1; i >= 0; i--) {
        if (segments[i].type === "text") {
          e.preventDefault();
          setEditingIndex(i);
          pendingFocusRef.current = { cursorPos: segments[i].value.length };
          return;
        }
      }
    }
    if (el && e.key === "ArrowRight") {
      const { text } = getEditableText();
      if (el.selectionStart === text.length && el.selectionEnd === text.length) {
        // Find the next text segment (skip over chips)
        for (let i = editingIndex + 1; i < segments.length; i++) {
          if (segments[i].type === "text") {
            e.preventDefault();
            setEditingIndex(i);
            pendingFocusRef.current = { cursorPos: 0 };
            return;
          }
        }
      }
    }

    // Backspace at position 0: remove the chip immediately before and merge text
    if (e.key === "Backspace" && el) {
      const { text, segmentIndex } = getEditableText();
      if (el.selectionStart === 0 && el.selectionEnd === 0 && segmentIndex > 0) {
        // Check if there's a chip just before
        const prevIdx = segmentIndex - 1;
        if (segments[prevIdx].type === "input") {
          e.preventDefault();
          const newSegments = [...segments];
          newSegments.splice(prevIdx, 1); // remove the chip
          const merged = normalizeSegments(newSegments);
          // Find the text segment that now occupies our position
          const newEditIdx = Math.max(0, prevIdx > 0 ? prevIdx - 1 : 0);
          // Find nearest text segment at or after newEditIdx
          let targetIdx = newEditIdx;
          for (let i = newEditIdx; i < merged.length; i++) {
            if (merged[i].type === "text") { targetIdx = i; break; }
          }
          setEditingIndex(targetIdx);
          const prevText = segmentIndex - 2 >= 0 && segments[segmentIndex - 2].type === "text"
            ? segments[segmentIndex - 2].value.length
            : 0;
          pendingFocusRef.current = { cursorPos: prevText };
          emitChange(merged);
          return;
        }
      }
      // Fallback: backspace on empty text removes nearest chip
      if (text === "" && segments.length > 1) {
        const newSegments = [...segments];
        // Find closest chip before the editing segment
        for (let i = segmentIndex - 1; i >= 0; i--) {
          if (newSegments[i].type === "input") {
            newSegments.splice(i, 1);
            const merged = normalizeSegments(newSegments);
            const newIdx = lastTextIndex(merged);
            setEditingIndex(newIdx);
            pendingFocusRef.current = { cursorPos: merged[newIdx]?.type === "text" ? merged[newIdx].value.length : 0 };
            emitChange(merged);
            return;
          }
        }
        // If no chip before, try after
        for (let i = segmentIndex + 1; i < newSegments.length; i++) {
          if (newSegments[i].type === "input") {
            newSegments.splice(i, 1);
            const merged = normalizeSegments(newSegments);
            setEditingIndex(lastTextIndex(merged));
            emitChange(merged);
            return;
          }
        }
      }
    }
  };

  const removeChip = (segmentIndex: number) => {
    const newSegments = segments.filter((_, i) => i !== segmentIndex);
    const merged = normalizeSegments(newSegments);
    // Update editingIndex to nearest valid text segment
    const newIdx = lastTextIndex(merged);
    setEditingIndex(newIdx);
    pendingFocusRef.current = {
      cursorPos: merged[newIdx]?.type === "text" ? merged[newIdx].value.length : 0,
    };
    emitChange(merged);
  };

  const getInputLabel = (inputId: string): string => {
    const inp = inputs.find((i) => i.id === inputId);
    return inp ? inp.input_label : inputId;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
        setShowFunctions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isEmpty =
    segments.length <= 1 &&
    segments[0]?.type === "text" &&
    !segments[0]?.value;

  /** Switch to editing a specific text segment */
  const switchToSegment = (segIdx: number, cursorPos?: number) => {
    setEditingIndex(segIdx);
    pendingFocusRef.current = { cursorPos: cursorPos ?? segments[segIdx]?.value?.length ?? 0 };
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-[32px] w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs transition-colors",
          "focus-within:border-foreground/50",
          hasError && "border-destructive focus-within:border-destructive"
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

          // Active text segment — render as <input>
          if (seg.type === "text" && i === editingIndex) {
            return (
              <input
                key={`edit-${i}`}
                ref={inputRef}
                type="text"
                value={seg.value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onSelect={handleCursorMove}
                onClick={handleCursorMove}
                onBlur={() => {
                  // Delay to allow clicking on suggestions
                  setTimeout(() => {
                    setShowMentions(false);
                    setShowFunctions(false);
                    setActiveFunc(null);
                    // Validate expression on blur
                    const expr = serializeSegments(segments);
                    const result = validateExpression(expr);
                    if (!result.valid) {
                      setHasError(true);
                      setErrorMessage(result.error ?? "Invalid expression");
                    }
                  }, 150);
                }}
                onFocus={() => {
                  // Clear validation error on focus
                  if (hasError) {
                    setHasError(false);
                    setErrorMessage("");
                  }
                }}
                placeholder={isEmpty ? placeholder : ""}
                className="flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-muted-foreground text-xs"
                autoComplete="off"
              />
            );
          }

          // Inactive text segment — render as clickable span
          if (seg.type === "text") {
            if (!seg.value) return null;
            return (
              <span
                key={`text-${i}`}
                className="text-xs whitespace-pre shrink-0 cursor-text"
                onClick={(e) => {
                  e.stopPropagation();
                  switchToSegment(i, seg.value.length);
                }}
              >
                {seg.value}
              </span>
            );
          }

          return null;
        })}
      </div>

      {/* Validation error message */}
      {hasError && errorMessage && !showMentions && !showFunctions && !activeFunc && (
        <p className="mt-1 text-[11px] text-destructive">{errorMessage}</p>
      )}

      {/* Function signature hint */}
      {activeFunc && !showMentions && !showFunctions && (
        <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-md border bg-popover px-3 py-1.5 shadow-sm">
          <span className="font-mono text-[11px] text-muted-foreground">
            {activeFunc.fn.name}(
            {activeFunc.fn.params.map((p, i) => (
              <span key={i}>
                {i > 0 && <span>, </span>}
                <span
                  className={cn(
                    i === activeFunc.paramIndex
                      ? "font-bold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {p}
                </span>
              </span>
            ))}
            )
          </span>
        </div>
      )}

      {/* @ Mentions dropdown */}
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

      {/* Function autocomplete dropdown */}
      {showFunctions && filteredFunctions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          <ul className="max-h-48 overflow-auto">
            {filteredFunctions.map((fn, idx) => (
              <li key={fn.name}>
                <button
                  type="button"
                  className={cn(
                    "w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted flex flex-col",
                    idx === selectedFunctionIndex && "bg-muted"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectFunction(fn);
                  }}
                >
                  <span className="font-semibold">{fn.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {fn.signature} — {fn.description}
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
