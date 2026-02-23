import { useMemo, type HTMLAttributes } from "react";

import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

// Support both UIMessage format (with parts) and simple format (with content)
type SimpleMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type UIMessageLike = {
  id: string;
  role: "user" | "assistant";
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
};

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  message: SimpleMessage | UIMessageLike;
  onApplyTheme?: (theme: { light: any; dark: any }) => void;
};

// Try to extract JSON theme from text content
function extractThemeFromText(text: string): {
  theme: any | null;
  isComplete: boolean;
} {
  if (!text) return { theme: null, isComplete: false };

  const trimmed = text.trim();

  // Strategy 1: Parse as a clean JSON string
  try {
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.light && parsed.dark) {
        return { theme: parsed, isComplete: true };
      }
    }
  } catch {
    // Not a clean JSON string
  }

  // Strategy 2: Extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.light && parsed.dark) {
        return { theme: parsed, isComplete: true };
      }
    } catch {
      // Ignore
    }
  }

  // Strategy 3: Find JSON by locating the outermost { ... } in the text
  // (handles preamble text like "Here's your theme:" before the JSON)
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.light && parsed.dark) {
        return { theme: parsed, isComplete: true };
      }
    } catch {
      // Extraction failed
    }
  }

  // Strategy 4: Partial streaming detection — close unclosed braces
  const hasOpenBrace = text.includes("{");
  const hasLight = text.includes('"light"');
  const hasDark = text.includes('"dark"');

  if (hasOpenBrace && (hasLight || hasDark)) {
    try {
      let partial = trimmed;
      const startIdx = partial.indexOf("{");
      if (startIdx > 0) partial = partial.substring(startIdx);

      if (!partial.endsWith("}")) {
        const openCount = (partial.match(/{/g) || []).length;
        const closeCount = (partial.match(/}/g) || []).length;
        partial += "}".repeat(Math.max(0, openCount - closeCount));
      }
      const parsed = JSON.parse(partial);
      if (parsed.light || parsed.dark) {
        return { theme: parsed, isComplete: false };
      }
    } catch {
      // Can't parse partial
    }
  }

  return { theme: null, isComplete: false };
}

// Helper to get text content from message (supports both formats)
function getMessageText(message: SimpleMessage | UIMessageLike): string {
  // Simple format with direct content
  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }
  // UIMessage format with parts
  if ("parts" in message && message.parts) {
    const textPart = message.parts.find(p => p.type === "text");
    if (textPart && textPart.type === "text" && textPart.text) {
      return textPart.text;
    }
  }
  return "";
}

export const Message = ({
  className,
  message,
  onApplyTheme,
  ...props
}: MessageProps) => {
  const messageText = getMessageText(message);
  
  // Extract theme from text content if this is an assistant message
  const themeData = useMemo(() => {
    if (message.role !== "assistant") return null;
    if (!messageText) return null;
    
    return extractThemeFromText(messageText);
  }, [message.role, messageText]);

  return (
    <div
      className={cn(
        "flex w-full gap-2 py-2",
        message.role === "user" ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex flex-col gap-3 max-w-[85%]",
          message.role === "user" ? "items-end" : "items-start",
        )}
      >
        {/* Render based on message content */}
        {(() => {
          // If this is an assistant message with theme data, show theme UI
          if (message.role === "assistant" && themeData?.theme) {
            const { theme, isComplete } = themeData;
            
            if (!isComplete) {
              // Streaming state - show preview
              return (
                <div
                  className="rounded-lg border border-border bg-card p-3 w-full shadow-sm"
                >
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse">✨</span>
                      <h4 className="font-semibold text-xs flex-1">
                        {theme?.title || (
                          <span className="text-muted-foreground italic">
                            Generating...
                          </span>
                        )}
                      </h4>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className="animate-spin">⚙️</span>
                      </span>
                    </div>
                    {theme?.concept && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {theme.concept}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div>
                      <p className="text-[9px] font-medium mb-1 text-muted-foreground">
                        ☀️ Light
                      </p>
                      <div className="grid grid-cols-8 gap-0.5 p-1 rounded border bg-muted/20">
                        {theme?.light ? (
                          Object.entries(theme.light)
                            .slice(0, 32)
                            .map(([key, value]: [string, any]) => (
                              <div
                                key={key}
                                className="h-3 w-full rounded-[2px] animate-in fade-in duration-200"
                                style={{ backgroundColor: value }}
                                title={key}
                              />
                            ))
                        ) : (
                          <div className="col-span-8 h-3 flex items-center justify-center text-[8px] text-muted-foreground animate-pulse">
                            ...
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-medium mb-1 text-muted-foreground">
                        🌙 Dark
                      </p>
                      <div className="grid grid-cols-8 gap-0.5 p-1 rounded border bg-muted/20">
                        {theme?.dark ? (
                          Object.entries(theme.dark)
                            .slice(0, 32)
                            .map(([key, value]: [string, any]) => (
                              <div
                                key={key}
                                className="h-3 w-full rounded-[2px] animate-in fade-in duration-200"
                                style={{ backgroundColor: value }}
                                title={key}
                              />
                            ))
                        ) : (
                          <div className="col-span-8 h-3 flex items-center justify-center text-[8px] text-muted-foreground animate-pulse">
                            ...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Complete state - show Apply button
            return (
              <div
                className="rounded-lg border-2 border-primary/20 bg-card p-3 w-full shadow-md"
              >
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <h4 className="font-semibold text-xs flex-1">
                      {theme.title || "Generated Theme"}
                    </h4>
                    <span className="px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded font-medium">
                      Ready
                    </span>
                  </div>
                  {theme.concept && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {theme.concept}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div>
                    <p className="text-[9px] font-medium mb-1 text-muted-foreground">
                      ☀️ Light
                    </p>
                    <div className="grid grid-cols-8 gap-0.5 p-1 rounded border bg-muted/20">
                      {Object.entries(theme.light)
                        .slice(0, 32)
                        .map(([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="h-3 w-full rounded-[2px]"
                            style={{ backgroundColor: value }}
                            title={key}
                          />
                        ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-medium mb-1 text-muted-foreground">
                      🌙 Dark
                    </p>
                    <div className="grid grid-cols-8 gap-0.5 p-1 rounded border bg-muted/20">
                      {Object.entries(theme.dark)
                        .slice(0, 32)
                        .map(([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="h-3 w-full rounded-[2px]"
                            style={{ backgroundColor: value }}
                            title={key}
                          />
                        ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onApplyTheme?.({
                        light: theme.light,
                        dark: theme.dark,
                      })
                    }
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    ✨ Apply Theme
                  </button>
                </div>
              </div>
            );
          }

          // Regular text message (user messages or non-theme responses)
          return (
            <Streamdown className="not-prose">
              {messageText}
            </Streamdown>
          );
        })()}
      </div>
    </div>
  );
};
