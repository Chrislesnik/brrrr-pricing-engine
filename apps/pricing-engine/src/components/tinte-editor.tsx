"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatHex, oklch, parse, rgb } from "culori";
import { Loader2, RefreshCw, Search, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { TinteLogo } from "@/components/logos/tinte";
import {
  convertTinteToShadcn,
  type TinteTheme,
} from "@/lib/tinte-to-shadcn";
import { ChatInput } from "./chat-input";
import { Message as ChatMessage } from "./chat-message";
import { ColorInput } from "./color-input";

type ShadcnTokens = Record<string, string>;

interface ShadcnTheme {
  light: ShadcnTokens;
  dark: ShadcnTokens;
}

interface TinteThemePreview {
  id: string;
  slug: string;
  name: string;
  concept?: string;
  is_public: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    foreground: string;
    background: string;
  };
  rawTheme?: TinteTheme;
  overrides?: {
    shadcn?: {
      light: ShadcnTokens;
      dark: ShadcnTokens;
    };
  };
}

// ============ Color Analysis Utilities ============

/**
 * Extract hue (0-360) from a hex color
 */
function getHue(hex: string): number | null {
  try {
    const color = parse(hex);
    if (!color) return null;
    const rgbColor = rgb(color);
    if (!rgbColor) return null;
    
    const r = rgbColor.r;
    const g = rgbColor.g;
    const b = rgbColor.b;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta === 0) return 0; // achromatic (gray)
    
    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
    
    return hue;
  } catch {
    return null;
  }
}

/**
 * Find first color in array that falls within a hue range
 */
function findColorByHueRange(
  colors: string[],
  minHue: number,
  maxHue: number
): string | undefined {
  for (const color of colors) {
    const hue = getHue(color);
    if (hue === null) continue;
    
    // Handle wrapping (e.g., red: 350-10)
    if (minHue > maxHue) {
      if (hue >= minHue || hue <= maxHue) return color;
    } else {
      if (hue >= minHue && hue <= maxHue) return color;
    }
  }
  return undefined;
}

/**
 * Lighten a hex color by a factor (0-1)
 */
function lightenColor(hex: string, factor: number): string {
  try {
    const color = parse(hex);
    if (!color) return hex;
    const rgbColor = rgb(color);
    if (!rgbColor) return hex;
    
    const r = Math.min(1, rgbColor.r + (1 - rgbColor.r) * factor);
    const g = Math.min(1, rgbColor.g + (1 - rgbColor.g) * factor);
    const b = Math.min(1, rgbColor.b + (1 - rgbColor.b) * factor);
    
    return formatHex({ mode: "rgb", r, g, b }) || hex;
  } catch {
    return hex;
  }
}

/**
 * Darken a hex color by a factor (0-1)
 */
function darkenColor(hex: string, factor: number): string {
  try {
    const color = parse(hex);
    if (!color) return hex;
    const rgbColor = rgb(color);
    if (!rgbColor) return hex;
    
    const r = Math.max(0, rgbColor.r * (1 - factor));
    const g = Math.max(0, rgbColor.g * (1 - factor));
    const b = Math.max(0, rgbColor.b * (1 - factor));
    
    return formatHex({ mode: "rgb", r, g, b }) || hex;
  } catch {
    return hex;
  }
}

/**
 * Get contrasting text color (black or white) for a background
 */
function getContrastTextColor(hex: string): string {
  try {
    const color = parse(hex);
    if (!color) return "#ffffff";
    const rgbColor = rgb(color);
    if (!rgbColor) return "#ffffff";
    
    // Use relative luminance formula
    const luminance = 0.299 * rgbColor.r + 0.587 * rgbColor.g + 0.114 * rgbColor.b;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

// ============ End Color Utilities ============

const TOKEN_GROUPS = [
  {
    label: "Background & Text",
    tokens: ["background", "foreground", "muted", "muted-foreground"],
  },
  {
    label: "Cards & Surfaces",
    tokens: ["card", "card-foreground", "popover", "popover-foreground"],
  },
  {
    label: "Interactive Elements",
    tokens: [
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "accent",
      "accent-foreground",
    ],
  },
  {
    label: "Forms & States",
    tokens: [
      "border",
      "input",
      "ring",
      "destructive",
      "destructive-foreground",
    ],
  },
  {
    label: "Charts",
    tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    label: "Status Badges",
    tokens: [
      "success",
      "success-foreground",
      "success-muted",
      "danger",
      "danger-foreground",
      "danger-muted",
      "warning",
      "warning-foreground",
      "warning-muted",
    ],
  },
  {
    label: "Loader Gradient",
    tokens: [
      "gradient-warm-1",
      "gradient-warm-2",
      "gradient-warm-3",
    ],
  },
  {
    label: "Highlight",
    tokens: [
      "highlight",
      "highlight-foreground",
      "highlight-muted",
    ],
  },
  {
    label: "Sidebar",
    tokens: [
      "sidebar-background",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
] as const;

// Static fallback values for status tokens (used when derivation fails)
const STATUS_TOKEN_FALLBACKS: Record<string, { light: string; dark: string }> = {
  "success": { light: "#16a34a", dark: "#22c55e" },
  "success-foreground": { light: "#ffffff", dark: "#ffffff" },
  "success-muted": { light: "#dcfce7", dark: "#14532d" },
  "danger": { light: "#dc2626", dark: "#b91c1c" },
  "danger-foreground": { light: "#ffffff", dark: "#ffffff" },
  "danger-muted": { light: "#fee2e2", dark: "#450a0a" },
  "warning": { light: "#f59e0b", dark: "#f59e0b" },
  "warning-foreground": { light: "#000000", dark: "#000000" },
  "warning-muted": { light: "#fef3c7", dark: "#422006" },
  // Loader gradient colors
  "gradient-warm-1": { light: "#ff3b30", dark: "#ff453a" },  // coral/red
  "gradient-warm-2": { light: "#ff6a00", dark: "#ff7a1a" },  // orange
  "gradient-warm-3": { light: "#ffd60a", dark: "#ffd60a" },  // yellow/gold
  // Highlight colors (for auto-filled/focused inputs)
  "highlight": { light: "#f59e0b", dark: "#fbbf24" },         // amber
  "highlight-foreground": { light: "#000000", dark: "#000000" },
  "highlight-muted": { light: "#fef3c7", dark: "#422006" },
};

/**
 * Derive status badge colors from theme tokens
 * - danger: derived from destructive
 * - success: search chart colors for green (90-150 hue), fallback to static
 * - warning: search chart colors for amber/yellow (30-60 hue), fallback to static
 */
function deriveStatusColors(
  tokens: ShadcnTokens,
  mode: "light" | "dark"
): Partial<ShadcnTokens> {
  const derived: Partial<ShadcnTokens> = {};
  
  // Get chart colors for analysis
  const chartColors = [
    tokens["chart-1"],
    tokens["chart-2"],
    tokens["chart-3"],
    tokens["chart-4"],
    tokens["chart-5"],
  ].filter(Boolean) as string[];
  
  // ---- DANGER: derive from destructive ----
  if (tokens["destructive"]) {
    derived["danger"] = tokens["destructive"];
    derived["danger-foreground"] = tokens["destructive-foreground"] || getContrastTextColor(tokens["destructive"]);
    // Muted: lighten for light mode, darken for dark mode
    derived["danger-muted"] = mode === "light" 
      ? lightenColor(tokens["destructive"], 0.85)
      : darkenColor(tokens["destructive"], 0.7);
  }
  
  // ---- SUCCESS: find green in chart colors (hue 90-150) ----
  const greenColor = findColorByHueRange(chartColors, 90, 150);
  if (greenColor) {
    derived["success"] = greenColor;
    derived["success-foreground"] = getContrastTextColor(greenColor);
    derived["success-muted"] = mode === "light"
      ? lightenColor(greenColor, 0.85)
      : darkenColor(greenColor, 0.7);
  }
  
  // ---- WARNING: find amber/yellow in chart colors (hue 30-60) ----
  const amberColor = findColorByHueRange(chartColors, 25, 55);
  if (amberColor) {
    derived["warning"] = amberColor;
    derived["warning-foreground"] = getContrastTextColor(amberColor);
    derived["warning-muted"] = mode === "light"
      ? lightenColor(amberColor, 0.85)
      : darkenColor(amberColor, 0.7);
  }
  
  // ---- GRADIENT: derive warm gradient from theme colors ----
  // Strategy: Find the most vibrant/saturated colors from the theme and create a gradient
  
  // First, try to find warm colors in chart colors
  const redColor = findColorByHueRange(chartColors, 345, 15) || findColorByHueRange(chartColors, 0, 20);
  const orangeColor = findColorByHueRange(chartColors, 15, 45);
  const yellowColor = findColorByHueRange(chartColors, 40, 65);
  
  // If we found warm colors in charts, use them
  if (redColor && orangeColor && yellowColor) {
    derived["gradient-warm-1"] = redColor;
    derived["gradient-warm-2"] = orangeColor;
    derived["gradient-warm-3"] = yellowColor;
  } else if (redColor || orangeColor || yellowColor) {
    // Partial match - use what we found and fill gaps
    derived["gradient-warm-1"] = redColor || orangeColor || yellowColor;
    derived["gradient-warm-2"] = orangeColor || redColor || yellowColor;
    derived["gradient-warm-3"] = yellowColor || orangeColor || redColor;
  } else {
    // No warm colors found - derive from primary/accent
    // Create a cohesive gradient based on the theme's key colors
    const primaryColor = tokens["primary"];
    const accentColor = tokens["accent"];
    const chart1 = tokens["chart-1"];
    
    // Use the most colorful option as base
    const baseColor = chart1 || accentColor || primaryColor;
    
    if (baseColor) {
      const baseHue = getHue(baseColor);
      
      if (baseHue !== null) {
        // Create a warm-ish gradient inspired by the theme
        // Shift the base color toward warm tones
        const color = parse(baseColor);
        if (color) {
          const rgbColor = rgb(color);
          if (rgbColor) {
            // Warm-1: Add red tint
            derived["gradient-warm-1"] = formatHex({
              mode: "rgb",
              r: Math.min(1, rgbColor.r * 1.2 + 0.3),
              g: rgbColor.g * 0.6,
              b: rgbColor.b * 0.3,
            });
            // Warm-2: Orange tint  
            derived["gradient-warm-2"] = formatHex({
              mode: "rgb",
              r: Math.min(1, rgbColor.r * 1.1 + 0.4),
              g: Math.min(1, rgbColor.g * 0.8 + 0.2),
              b: rgbColor.b * 0.2,
            });
            // Warm-3: Yellow tint
            derived["gradient-warm-3"] = formatHex({
              mode: "rgb",
              r: Math.min(1, rgbColor.r * 1.0 + 0.5),
              g: Math.min(1, rgbColor.g * 1.0 + 0.4),
              b: rgbColor.b * 0.1,
            });
          }
        }
      }
    }
  }
  
  return derived;
}

// Ensure theme has all status tokens - derive from theme or use fallbacks
function ensureStatusTokens(theme: ShadcnTheme): ShadcnTheme {
  const result: ShadcnTheme = {
    light: { ...theme.light },
    dark: { ...theme.dark },
  };
  
  // Derive status colors from theme tokens
  const derivedLight = deriveStatusColors(result.light, "light");
  const derivedDark = deriveStatusColors(result.dark, "dark");
  
  // Apply derived colors first (if available)
  for (const [token, value] of Object.entries(derivedLight)) {
    if (!result.light[token] && value) {
      result.light[token] = value;
    }
  }
  for (const [token, value] of Object.entries(derivedDark)) {
    if (!result.dark[token] && value) {
      result.dark[token] = value;
    }
  }
  
  // Fill any remaining gaps with static fallbacks
  for (const [token, fallbacks] of Object.entries(STATUS_TOKEN_FALLBACKS)) {
    if (!result.light[token]) {
      result.light[token] = fallbacks.light;
    }
    if (!result.dark[token]) {
      result.dark[token] = fallbacks.dark;
    }
  }
  
  return result;
}

interface TinteEditorProps {
  onChange?: (theme: ShadcnTheme) => void;
  onSave?: (theme: ShadcnTheme) => Promise<void>;
  initialTheme?: ShadcnTheme;
  /** Render inline instead of as a floating button + dialog */
  inline?: boolean;
}

export function TinteEditor({ onChange, onSave, initialTheme, inline = false }: TinteEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<ShadcnTheme>(() => 
    ensureStatusTokens(initialTheme ?? { light: {}, dark: {} })
  );
  const themeRef = useRef<ShadcnTheme>(ensureStatusTokens(initialTheme ?? { light: {}, dark: {} }));
  const initializedRef = useRef(false);
  const [_originalFormats, setOriginalFormats] = useState<
    Record<string, Record<string, string>>
  >({
    light: {},
    dark: {},
  });
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(false);
  const [rawCss, setRawCss] = useState("");

  const [tinteThemes, setTinteThemes] = useState<TinteThemePreview[]>([]);
  const [loadingTinteThemes, setLoadingTinteThemes] = useState(false);
  const [tinteError, setTinteError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const [apiKeyError, setApiKeyError] = useState(false);
  
  // Simple chat state management (replaces useChat which needs AI SDK format)
  type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"idle" | "streaming">("idle");
  
  const sendMessage = useCallback(async ({ text }: { text: string }) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setChatStatus("streaming");
    setApiKeyError(false);
    
    // Create assistant message placeholder
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMessage]);
    
    try {
      const response = await fetch("/api/tinte/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      
      const decoder = new TextDecoder();
      let fullContent = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // Update the assistant message with accumulated content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof Error && error.message?.includes("OpenAI API key")) {
        setApiKeyError(true);
      }
      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }
            : m
        )
      );
    } finally {
      setChatStatus("idle");
    }
  }, [messages]);

  const convertToHex = useCallback((colorValue: string): string => {
    try {
      const trimmed = colorValue.trim();
      if (trimmed.startsWith("#")) {
        return trimmed; // Already hex
      }
      const colorObj = oklch(trimmed);
      if (colorObj) {
        return formatHex(colorObj) || colorValue;
      }
      return colorValue;
    } catch {
      return colorValue;
    }
  }, []);

  const handleApplyTheme = useCallback(
    async (newTheme: { light: ShadcnTokens; dark: ShadcnTokens }) => {
      const lightHex: ShadcnTokens = {};
      const darkHex: ShadcnTokens = {};

      Object.entries(newTheme.light).forEach(([key, value]) => {
        lightHex[key] = convertToHex(value);
      });

      Object.entries(newTheme.dark).forEach(([key, value]) => {
        darkHex[key] = convertToHex(value);
      });

      const hexTheme = ensureStatusTokens({ light: lightHex, dark: darkHex });

      setTheme(hexTheme);
      onChange?.(hexTheme);

      setOriginalFormats({
        light: { ...lightHex },
        dark: { ...darkHex },
      });

      // Apply the theme visually
      const styleId = "tinte-dynamic-theme";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      const lightTokens = Object.entries(hexTheme.light)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");

      const darkTokens = Object.entries(hexTheme.dark)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");

      styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;

      // Auto-save to Supabase when applying from AI Agent
      if (onSave) {
        setSaveStatus("saving");
        try {
          await onSave(hexTheme);
          setSaveStatus("success");
          setHasUnsavedChanges(false);
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Failed to save theme:", error);
          setSaveStatus("error");
          setHasUnsavedChanges(true);
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      } else {
        setHasUnsavedChanges(true);
      }
    },
    [onChange, convertToHex, onSave],
  );

  // Detect color format
  const detectColorFormat = useCallback(
    (colorValue: string): "hex" | "oklch" | "rgb" | "hsl" | "unknown" => {
      const trimmed = colorValue.trim();
      if (trimmed.startsWith("#")) return "hex";
      if (trimmed.startsWith("oklch(")) return "oklch";
      if (trimmed.startsWith("rgb(")) return "rgb";
      if (trimmed.startsWith("hsl(")) return "hsl";
      return "unknown";
    },
    [],
  );

  // Load theme from DOM CSS variables
  const loadTheme = useCallback(async () => {
    setLoading(true);
    try {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      // Get all CSS variable names that are theme-related
      const allTokens = TOKEN_GROUPS.flatMap((group) => group.tokens);

      const lightHex: ShadcnTokens = {};
      const darkHex: ShadcnTokens = {};

      // Read light mode variables
      allTokens.forEach((token) => {
        const value = computedStyle.getPropertyValue(`--${token}`).trim();
        if (value) {
          lightHex[token] = convertToHex(value);
        }
      });

      // Temporarily switch to dark mode to read dark variables
      const wasDark = root.classList.contains("dark");
      if (!wasDark) {
        root.classList.add("dark");
      }

      const darkComputedStyle = getComputedStyle(root);
      allTokens.forEach((token) => {
        const value = darkComputedStyle.getPropertyValue(`--${token}`).trim();
        if (value) {
          darkHex[token] = convertToHex(value);
        }
      });

      // Restore original theme
      if (!wasDark) {
        root.classList.remove("dark");
      }

      setTheme(ensureStatusTokens({ light: lightHex, dark: darkHex }));
      setOriginalFormats({ light: lightHex, dark: darkHex });
    } catch (error) {
      console.error("Error loading theme from DOM:", error);
    }
    setLoading(false);
  }, [convertToHex]);

  // Fetch Tinte themes
  const fetchTinteThemes = useCallback(async (page = 1, search?: string) => {
    setLoadingTinteThemes(true);
    setTinteError(null);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(
        `https://www.tinte.dev/api/themes/public?limit=20&page=${page}${searchParam}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch themes from Tinte");
      }
      const data = await response.json();
      setTinteThemes(data.themes || []);
      setCurrentPage(data.pagination.page);
      setHasMore(data.pagination.hasMore);
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
    } catch (error) {
      console.error("Error fetching Tinte themes:", error);
      setTinteError(
        error instanceof Error ? error.message : "Failed to load themes",
      );
    } finally {
      setLoadingTinteThemes(false);
    }
  }, []);

  // Apply theme CSS to DOM for preview (without saving)
  const applyThemePreview = useCallback((themeToApply: ShadcnTheme) => {
    const styleId = "tinte-dynamic-theme";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const lightTokens = Object.entries(themeToApply.light)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");

    const darkTokens = Object.entries(themeToApply.dark)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");

    styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;
  }, []);

  // Apply Tinte theme (preview only - doesn't save until user clicks Save)
  const applyTinteTheme = useCallback(
    (tinteTheme: TinteThemePreview) => {
      let shadcnTheme: { light: ShadcnTokens; dark: ShadcnTokens } | null =
        null;

      if (tinteTheme.rawTheme) {
        // Convert Tinte format to shadcn format
        shadcnTheme = convertTinteToShadcn(tinteTheme.rawTheme);
      } else if (
        tinteTheme.overrides?.shadcn?.light &&
        tinteTheme.overrides?.shadcn?.dark
      ) {
        // Use shadcn override only if it has light and dark color objects
        shadcnTheme = tinteTheme.overrides.shadcn;
      }

      if (shadcnTheme) {
        // Convert all colors to hex format
        const lightHex: ShadcnTokens = {};
        const darkHex: ShadcnTokens = {};

        Object.entries(shadcnTheme.light).forEach(([key, value]) => {
          lightHex[key] = convertToHex(value);
        });

        Object.entries(shadcnTheme.dark).forEach(([key, value]) => {
          darkHex[key] = convertToHex(value);
        });

        const hexTheme = ensureStatusTokens({ light: lightHex, dark: darkHex });

        // Update state
        setTheme(hexTheme);
        onChange?.(hexTheme);
        setSelectedThemeId(tinteTheme.id);
        setHasUnsavedChanges(true);

        // Apply CSS preview to DOM (but don't save yet)
        applyThemePreview(hexTheme);
      }
    },
    [onChange, convertToHex, applyThemePreview],
  );

  // Initialize theme
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    setMode(isDark ? "dark" : "light");
    
    // If initial theme provided, apply it and skip loading from DOM
    if (initialTheme && Object.keys(initialTheme.light).length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setTheme(ensureStatusTokens(initialTheme));
      setOriginalFormats({
        light: { ...initialTheme.light },
        dark: { ...initialTheme.dark },
      });
      // Apply initial theme to DOM
      const styleId = "tinte-dynamic-theme";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      const lightTokens = Object.entries(initialTheme.light)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");
      const darkTokens = Object.entries(initialTheme.dark)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");
      styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;
    } else if (!initializedRef.current) {
      initializedRef.current = true;
      loadTheme();
    }
  }, [loadTheme, initialTheme]);

  // Fetch Tinte themes when dialog opens or when inline
  useEffect(() => {
    if ((isOpen || inline) && tinteThemes.length === 0) {
      fetchTinteThemes();
    }
  }, [isOpen, inline, tinteThemes.length, fetchTinteThemes]);

  const handleTokenEdit = useCallback(
    (token: string, newValue: string) => {
      setTheme((prev) => {
        const updated = {
          ...prev,
          [mode]: {
            ...prev[mode],
            [token]: newValue,
          },
        };

        onChange?.(updated);
        
        // Apply CSS preview to DOM immediately
        applyThemePreview(updated);
        
        return updated;
      });

      // Update original formats with new value
      setOriginalFormats((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          [token]: newValue,
        },
      }));

      // Mark as unsaved
      setHasUnsavedChanges(true);
    },
    [mode, onChange, applyThemePreview],
  );

  // Sync mode with DOM changes (controlled by next-themes)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setMode(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Generate raw CSS from theme
  const generateRawCss = useCallback(() => {
    if (!theme.light || !theme.dark) return "";

    const lightTokens = Object.entries(theme.light)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");

    const darkTokens = Object.entries(theme.dark)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");

    if (!lightTokens && !darkTokens) return "";

    return `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;
  }, [theme]);

  // Parse raw CSS and update theme
  const parseRawCss = useCallback(
    (css: string) => {
      try {
        const light: ShadcnTokens = {};
        const dark: ShadcnTokens = {};

        // Match :root block
        const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
        if (rootMatch) {
          const rootContent = rootMatch[1];
          const variableMatches = rootContent.matchAll(
            /--([^:]+):\s*([^;]+);/g,
          );
          for (const match of variableMatches) {
            const key = match[1].trim();
            const value = match[2].trim();
            light[key] = value;
          }
        }

        // Match .dark block
        const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
        if (darkMatch) {
          const darkContent = darkMatch[1];
          const variableMatches = darkContent.matchAll(
            /--([^:]+):\s*([^;]+);/g,
          );
          for (const match of variableMatches) {
            const key = match[1].trim();
            const value = match[2].trim();
            dark[key] = value;
          }
        }

        const parsedTheme = { light, dark };
        setTheme(parsedTheme);
        onChange?.(parsedTheme);
        setHasUnsavedChanges(true);
        
        // Apply CSS preview to DOM
        applyThemePreview(parsedTheme);
      } catch (error) {
        console.error("Failed to parse CSS:", error);
      }
    },
    [onChange, applyThemePreview],
  );

  // Update raw CSS when theme changes
  useEffect(() => {
    setRawCss(generateRawCss());
  }, [generateRawCss]);

  // Write to globals.css file
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const writeToGlobals = useCallback(async () => {
    // Use ref to get the latest theme state
    const currentTheme = themeRef.current;

    if (!currentTheme.light || !currentTheme.dark) {
      console.error("Theme is not fully loaded");
      return;
    }

    setSaveStatus("saving");

    try {
      // Ensure all colors are in hex format before applying
      const lightHex: ShadcnTokens = {};
      const darkHex: ShadcnTokens = {};

      Object.entries(currentTheme.light).forEach(([key, value]) => {
        lightHex[key] = convertToHex(value);
      });

      Object.entries(currentTheme.dark).forEach(([key, value]) => {
        darkHex[key] = convertToHex(value);
      });

      const hexTheme = { light: lightHex, dark: darkHex };

      // Apply to DOM immediately
      const styleId = "tinte-dynamic-theme";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      const lightTokens = Object.entries(lightHex)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");

      const darkTokens = Object.entries(darkHex)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");

      styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;

      // If onSave callback provided, persist to backend
      if (onSave) {
        await onSave(hexTheme);
      }

      setSaveStatus("success");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving theme:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [convertToHex, onSave]);

  const _availableTokens = TOKEN_GROUPS.flatMap((group) =>
    group.tokens.filter((token) => theme[mode]?.[token] !== undefined),
  );

  // Shared header component for both inline and dialog modes
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <TinteLogo className="w-5 h-5" />
        <span className="text-base font-semibold">Theme Editor</span>
        <a
          href="https://tinte.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          tinte.dev ↗
        </a>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={loadTheme}
          disabled={loading}
          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          title="Reload theme"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
        </button>
        <button
          type="button"
          onClick={writeToGlobals}
          disabled={saveStatus === "saving"}
          className={`relative px-3 py-1.5 text-xs rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasUnsavedChanges
              ? "bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse"
              : "bg-primary/80 text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {hasUnsavedChanges && saveStatus === "idle" && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
            </span>
          )}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "success" && "✅ Saved!"}
          {saveStatus === "error" && "❌ Error"}
          {saveStatus === "idle" &&
            (hasUnsavedChanges ? "💾 Save" : "Save")}
        </button>
        {!inline && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors ml-1"
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );

  // Shared tabs content for both inline and dialog modes
  const tabsContent = (
    <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin mr-2" size={20} />
              <span>Loading theme...</span>
            </div>
          ) : (
            <Tabs
              defaultValue="editor"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="mx-4 mt-4 mb-4">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="raw">Raw CSS</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>

              <TabsContent
                value="editor"
                className="flex-1 h-0 flex flex-col overflow-hidden px-4 pb-4"
              >
                <div className="h-[500px] border rounded-md bg-muted/20 overflow-y-auto p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-2"
                    defaultValue="Background & Text"
                  >
                    {TOKEN_GROUPS.map((group) => {
                      const groupTokens = group.tokens.filter(
                        (token) => theme[mode]?.[token] !== undefined,
                      );
                      if (groupTokens.length === 0) return null;

                      return (
                        <AccordionItem
                          value={group.label}
                          key={group.label}
                          className="rounded-md border bg-background px-4 py-1 outline-none last:border-b has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                        >
                          <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                            <span className="uppercase tracking-wide">
                              {group.label} ({groupTokens.length})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-2">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {groupTokens.map((token) => (
                                <div key={token} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      {token.replace(/-/g, " ")}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {detectColorFormat(theme[mode][token])}
                                    </span>
                                  </div>
                                  <ColorInput
                                    value={theme[mode][token]}
                                    onChange={(color) =>
                                      handleTokenEdit(token, color)
                                    }
                                    label={token}
                                  />
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </TabsContent>

              <TabsContent
                value="browse"
                className="flex-1 h-0 flex flex-col overflow-hidden px-4 pb-4"
              >
                <div className="flex flex-col gap-4 h-[500px]">
                  <div className="flex-1 border rounded-md bg-muted/20 overflow-y-auto p-4">
                    {loadingTinteThemes ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-sm text-muted-foreground">
                          Loading themes from tinte.dev...
                        </p>
                      </div>
                    ) : tinteError ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="text-4xl">⚠️</div>
                        <div className="text-center space-y-2 max-w-md">
                          <h3 className="font-semibold text-lg">
                            Failed to Load Themes
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tinteError}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => fetchTinteThemes()}
                            className="mt-2"
                          >
                            <RefreshCw size={16} className="mr-2" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : tinteThemes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <p className="text-sm text-muted-foreground">
                          No themes available
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fetchTinteThemes()}
                          size="sm"
                        >
                          <RefreshCw size={16} className="mr-2" />
                          Refresh
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="text"
                                placeholder="Search themes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setActiveSearch(searchQuery);
                                    fetchTinteThemes(1, searchQuery);
                                  }
                                }}
                                className="h-9 pr-8"
                              />
                              {searchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery("");
                                    setActiveSearch("");
                                    fetchTinteThemes(1);
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
                                >
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveSearch(searchQuery);
                                fetchTinteThemes(1, searchQuery);
                              }}
                              disabled={!searchQuery}
                              className="h-9"
                            >
                              <Search className="h-3.5 w-3.5 mr-1.5" />
                              Search
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                fetchTinteThemes(currentPage, activeSearch)
                              }
                              title="Refresh themes"
                              className="h-9 w-9"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {tinteThemes.length} themes
                              {activeSearch
                                ? ` matching "${activeSearch}"`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {tinteThemes.map((tinteTheme) => {
                            const isSelected =
                              selectedThemeId === tinteTheme.id;
                            return (
                              <button
                                key={tinteTheme.id}
                                type="button"
                                onClick={() => applyTinteTheme(tinteTheme)}
                                className={`group text-left p-4 border-2 rounded-lg transition-all relative ${
                                  isSelected
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-border hover:border-primary hover:bg-accent/50"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                                    Selected
                                  </div>
                                )}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-1.5">
                                    <h4
                                      className={`font-medium transition-colors ${
                                        isSelected
                                          ? "text-primary"
                                          : "group-hover:text-primary"
                                      }`}
                                    >
                                      {tinteTheme.name}
                                    </h4>
                                    {tinteTheme.concept && (
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {tinteTheme.concept}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    {[
                                      tinteTheme.colors.background,
                                      tinteTheme.colors.primary,
                                      tinteTheme.colors.secondary,
                                      tinteTheme.colors.accent,
                                      tinteTheme.colors.foreground,
                                    ].map((color, idx) => (
                                      <div
                                        key={`${tinteTheme.id}-color-${idx}`}
                                        className="w-6 h-6 rounded border border-border/50"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Pagination Controls */}
                  {!loadingTinteThemes &&
                    !tinteError &&
                    tinteThemes.length > 0 && (
                      <div className="flex items-center justify-between px-2 py-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fetchTinteThemes(currentPage - 1, activeSearch)
                            }
                            disabled={currentPage === 1 || loadingTinteThemes}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fetchTinteThemes(currentPage + 1, activeSearch)
                            }
                            disabled={!hasMore || loadingTinteThemes}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent
                value="raw"
                className="flex-1 h-0 flex flex-col overflow-hidden px-4 pb-4"
              >
                <Textarea
                  value={rawCss}
                  onChange={(e) => {
                    setRawCss(e.target.value);
                    parseRawCss(e.target.value);
                  }}
                  className="h-[500px] w-full bg-muted/40 font-mono text-xs resize-none border border-border focus-visible:ring-0 p-4"
                  placeholder="Paste your CSS here..."
                  spellCheck={false}
                />
              </TabsContent>

              <TabsContent
                value="agent"
                className="flex-1 h-0 flex flex-col overflow-hidden px-4 pb-4"
              >
                <div className="h-[500px] flex flex-col gap-3">
                  <div className="flex-1 border rounded-md bg-muted/20 overflow-y-auto p-4 space-y-2">
                    {apiKeyError ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="text-center space-y-3 max-w-md">
                          <div className="text-4xl">🔑</div>
                          <h3 className="font-semibold text-lg">
                            OpenAI API Key Required
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            To use the AI Theme Generator, you need to configure
                            your OpenAI API key.
                          </p>
                          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                            <p className="text-xs font-medium">
                              Add to your{" "}
                              <code className="bg-background px-1.5 py-0.5 rounded">
                                .env.local
                              </code>{" "}
                              file:
                            </p>
                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                              <code>OPENAI_API_KEY=your-api-key-here</code>
                            </pre>
                            <p className="text-xs text-muted-foreground">
                              Get your API key from{" "}
                              <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                platform.openai.com/api-keys
                              </a>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setApiKeyError(false);
                            }}
                            className="mt-2"
                          >
                            I've added the API key
                          </Button>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold text-lg">
                            AI Theme Generator
                          </h3>
                          <p className="text-muted-foreground text-sm max-w-md">
                            Describe your ideal theme and let AI generate a
                            complete color palette for you
                          </p>
                        </div>
                        <div className="grid gap-2 w-full max-w-md px-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            Suggested prompts:
                          </p>
                          <Button
                            variant="outline"
                            onClick={() =>
                              sendMessage({
                                text: "Create a purple theme with high contrast for accessibility",
                              })
                            }
                            className="justify-start h-auto py-3 whitespace-normal text-left"
                          >
                            Create a purple theme with high contrast
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              sendMessage({
                                text: "Generate a warm autumn theme with orange and brown tones",
                              })
                            }
                            className="justify-start h-auto py-3 whitespace-normal text-left"
                          >
                            Generate a warm autumn theme
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              sendMessage({
                                text: "Create a modern dark theme with blue accents",
                              })
                            }
                            className="justify-start h-auto py-3 whitespace-normal text-left"
                          >
                            Create a modern dark theme with blue accents
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              sendMessage({
                                text: "Design a soft pastel theme perfect for a wellness app",
                              })
                            }
                            className="justify-start h-auto py-3 whitespace-normal text-left"
                          >
                            Design a soft pastel wellness theme
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            onApplyTheme={handleApplyTheme}
                          />
                        ))}
                        {chatStatus === "streaming" && messages[messages.length - 1]?.content === "" && (
                          <div className="flex items-center gap-2 text-muted-foreground p-3 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating theme...</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <ChatInput
                    onSubmit={(msg) => {
                      sendMessage({ text: msg });
                    }}
                    disabled={chatStatus === "streaming"}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
  );

  // Inline mode: render content directly without dialog
  if (inline) {
    return (
      <div className="flex flex-col rounded-lg border bg-card">
        <div className="border-b p-4">
          {headerContent}
        </div>
        <div className="flex-1 min-h-0">
          {tabsContent}
        </div>
      </div>
    );
  }

  // Dialog mode: render as floating button + modal
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Floating Ball Trigger */}
      <div className="fixed bottom-4 right-4 z-50">
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-14 h-14 bg-card border-2 border-border rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center hover:shadow-xl"
            title="Open Theme Editor"
          >
            <TinteLogo className="w-7 h-7 drop-shadow-sm" />
          </button>
        </DialogTrigger>
      </div>

      {/* Dialog Content */}
      <DialogContent showCloseButton={false} className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          {headerContent}
        </DialogHeader>

        {/* Content */}
        {tabsContent}
      </DialogContent>
    </Dialog>
  );
}
