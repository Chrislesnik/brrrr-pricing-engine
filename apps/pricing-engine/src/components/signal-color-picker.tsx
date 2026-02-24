"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/shadcn/button";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerInlineContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerInput,
} from "@repo/ui/shadcn/color-picker";
import { cn } from "@repo/lib/cn";

export const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function SignalColorPicker({
  value,
  onChange,
  hint,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  hint?: string;
}) {
  const [color, setColor] = useState(value || "#3b82f6");
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      onChange(newColor);
    },
    [onChange],
  );

  const onReset = useCallback(() => {
    onChange(null);
    setPickerOpen(false);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-8 text-xs"
          onClick={() => setPickerOpen((o) => !o)}
        >
          {pickerOpen ? (
            "Close"
          ) : (
            <>
              <span
                className="size-4 rounded-sm border shadow-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              Pick Color
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onReset}>
          Reset
        </Button>
      </div>

      {pickerOpen && (
        <ColorPicker value={color} onValueChange={handleColorChange} inline>
          <ColorPickerInlineContent>
            <ColorPickerArea />
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <div className="flex flex-1 flex-col gap-2">
                <ColorPickerHueSlider />
              </div>
            </div>
            <ColorPickerInput />
          </ColorPickerInlineContent>
        </ColorPicker>
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            className={cn(
              "size-7 rounded border-2 border-transparent hover:border-border focus:border-ring focus:outline-none transition-all",
              value === presetColor && "ring-2 ring-foreground ring-offset-1",
            )}
            style={{ backgroundColor: presetColor }}
            onClick={() => handleColorChange(presetColor)}
          />
        ))}
      </div>

      {hint && (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
