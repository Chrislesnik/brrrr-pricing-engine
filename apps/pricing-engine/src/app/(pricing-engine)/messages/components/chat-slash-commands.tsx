"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  FileText,
  MessageCircle,
  DollarSign,
  AtSign,
  Link2,
  Languages,
  Wand2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  section: string;
}

interface ChatSlashCommandsProps {
  position: { top: number; left: number };
  onSelect: (commandId: string) => void;
  onClose: () => void;
  dealId: string;
}

// ─── Command Definitions ─────────────────────────────────────────────
const COMMANDS: SlashCommandItem[] = [
  // AI Section
  {
    id: "ask-ai",
    title: "Ask AI",
    description: "Ask a question about this deal",
    icon: <Sparkles className="h-4 w-4" />,
    section: "AI",
  },
  {
    id: "summarize",
    title: "Summarize Thread",
    description: "Get a summary of the conversation",
    icon: <FileText className="h-4 w-4" />,
    section: "AI",
  },
  {
    id: "draft-response",
    title: "Draft Response",
    description: "AI drafts a reply based on context",
    icon: <Wand2 className="h-4 w-4" />,
    section: "AI",
  },
  {
    id: "translate",
    title: "Translate",
    description: "Translate a message to another language",
    icon: <Languages className="h-4 w-4" />,
    section: "AI",
  },
  // Loan Section
  {
    id: "get-loan-pricing",
    title: "Get Loan Pricing",
    description: "Pull deal inputs and generate pricing",
    icon: <DollarSign className="h-4 w-4" />,
    section: "LOAN",
  },
  {
    id: "generate-term-sheet",
    title: "Generate Term Sheet",
    description: "Create a term sheet for this deal",
    icon: <FileText className="h-4 w-4" />,
    section: "LOAN",
  },
  // Actions Section
  {
    id: "mention",
    title: "Mention Someone",
    description: "Tag a team member in this channel",
    icon: <AtSign className="h-4 w-4" />,
    section: "ACTIONS",
  },
  {
    id: "share-link",
    title: "Share Deal Link",
    description: "Share a link to this deal",
    icon: <Link2 className="h-4 w-4" />,
    section: "ACTIONS",
  },
];

// ─── Component ───────────────────────────────────────────────────────
export function ChatSlashCommands({
  position,
  onSelect,
  onClose,
  dealId,
}: ChatSlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands
  const filtered = filter
    ? COMMANDS.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(filter.toLowerCase()) ||
          cmd.description.toLowerCase().includes(filter.toLowerCase())
      )
    : COMMANDS;

  // Group by section
  const sections = Array.from(new Set(filtered.map((c) => c.section)));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            onSelect(filtered[selectedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        default:
          // Build filter from typed characters
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setFilter((prev) => prev + e.key);
            setSelectedIndex(0);
          }
          if (e.key === "Backspace") {
            setFilter((prev) => prev.slice(0, -1));
            setSelectedIndex(0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Calculate position (render above cursor)
  const style: React.CSSProperties = {
    position: "fixed",
    bottom: `${window.innerHeight - position.top}px`,
    left: `${Math.max(16, Math.min(position.left, window.innerWidth - 340))}px`,
    zIndex: 9999,
  };

  let flatIndex = 0;

  return createPortal(
    <div
      ref={containerRef}
      style={style}
      className="min-w-[280px] max-w-[320px] max-h-[380px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
      role="listbox"
    >
      {/* Filter hint */}
      {filter && (
        <div className="px-2.5 py-1 text-[10px] text-muted-foreground">
          Filter: {filter}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="px-2.5 py-4 text-center text-xs text-muted-foreground">
          No commands found
        </div>
      ) : (
        sections.map((section) => {
          const sectionItems = filtered.filter(
            (cmd) => cmd.section === section
          );
          return (
            <div key={section}>
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {section}
              </div>
              {sectionItems.map((cmd) => {
                const currentIndex = flatIndex++;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={currentIndex === selectedIndex}
                    onClick={() => onSelect(cmd.id)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer transition-colors ${
                      currentIndex === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {cmd.icon}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="text-[13px] font-medium">
                        {cmd.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cmd.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </div>,
    document.body
  );
}
