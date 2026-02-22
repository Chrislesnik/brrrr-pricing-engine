"use client"

import * as React from "react"
import {
  ColorPicker as ArkColorPicker,
  parseColor,
} from "@ark-ui/react/color-picker"
import { Pipette } from "lucide-react"
import { cn } from "@repo/lib/cn"

/* -------------------------------------------------------------------------- */
/*  Root                                                                       */
/* -------------------------------------------------------------------------- */

type ColorPickerProps = {
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  inline?: boolean
  defaultFormat?: "rgba" | "hsla"
  children: React.ReactNode
  className?: string
}

function ColorPicker({
  value,
  onValueChange,
  open,
  onOpenChange,
  inline,
  defaultFormat = "rgba",
  children,
  className,
}: ColorPickerProps) {
  const parsed = React.useMemo(() => {
    if (!value) return undefined
    try {
      return parseColor(value)
    } catch {
      return undefined
    }
  }, [value])

  const openProps: Record<string, unknown> = {}
  if (open !== undefined) openProps.open = open
  if (onOpenChange) openProps.onOpenChange = (details: { open: boolean }) => onOpenChange(details.open)

  return (
    <ArkColorPicker.Root
      value={parsed}
      onValueChange={(details) => {
        try {
          onValueChange?.(details.value.toString("hex"))
        } catch {
          onValueChange?.(details.valueAsString)
        }
      }}
      defaultFormat={defaultFormat}
      className={className}
      inline={inline}
      {...openProps}
    >
      {children}
      <ArkColorPicker.HiddenInput />
    </ArkColorPicker.Root>
  )
}

/* -------------------------------------------------------------------------- */
/*  Trigger                                                                    */
/* -------------------------------------------------------------------------- */

const ColorPickerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ArkColorPicker.Trigger>
>(({ className, ...props }, ref) => (
  <ArkColorPicker.Trigger ref={ref} className={className} {...props} />
))
ColorPickerTrigger.displayName = "ColorPickerTrigger"

/* -------------------------------------------------------------------------- */
/*  Content (popover body)                                                     */
/* -------------------------------------------------------------------------- */

const ColorPickerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <ArkColorPicker.Positioner>
    <ArkColorPicker.Content
      ref={ref}
      className={cn(
        "z-50 w-64 rounded-lg border bg-popover p-3 shadow-md outline-none",
        "flex flex-col gap-3",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    >
      {children}
    </ArkColorPicker.Content>
  </ArkColorPicker.Positioner>
))
ColorPickerContent.displayName = "ColorPickerContent"

function ColorPickerInlineContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ArkColorPicker.Content
      className={cn(
        "w-full rounded-lg border bg-popover p-3 shadow-sm outline-none",
        "flex flex-col gap-3",
        className,
      )}
    >
      {children}
    </ArkColorPicker.Content>
  )
}

/* -------------------------------------------------------------------------- */
/*  Area (2-D saturation / lightness canvas)                                   */
/* -------------------------------------------------------------------------- */

function ColorPickerArea({ className }: { className?: string }) {
  return (
    <ArkColorPicker.Area
      className={cn("h-36 w-full overflow-hidden rounded-md", className)}
    >
      <ArkColorPicker.AreaBackground className="h-full w-full rounded-[inherit]" />
      <ArkColorPicker.AreaThumb className="size-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20" />
    </ArkColorPicker.Area>
  )
}

/* -------------------------------------------------------------------------- */
/*  Channel sliders                                                            */
/* -------------------------------------------------------------------------- */

function ChannelSlider({
  channel,
  className,
}: {
  channel: "hue" | "alpha"
  className?: string
}) {
  return (
    <ArkColorPicker.ChannelSlider
      channel={channel}
      className={cn("relative", className)}
    >
      <ArkColorPicker.ChannelSliderTrack className="h-3 w-full rounded-full" />
      <ArkColorPicker.ChannelSliderThumb className="top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20" />
    </ArkColorPicker.ChannelSlider>
  )
}

function ColorPickerHueSlider({ className }: { className?: string }) {
  return <ChannelSlider channel="hue" className={className} />
}

function ColorPickerAlphaSlider({ className }: { className?: string }) {
  return <ChannelSlider channel="alpha" className={className} />
}

/* -------------------------------------------------------------------------- */
/*  Eye Dropper                                                                */
/* -------------------------------------------------------------------------- */

function ColorPickerEyeDropper({ className }: { className?: string }) {
  return (
    <ArkColorPicker.EyeDropperTrigger
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      <Pipette className="size-4" />
    </ArkColorPicker.EyeDropperTrigger>
  )
}

/* -------------------------------------------------------------------------- */
/*  Format select                                                              */
/* -------------------------------------------------------------------------- */

function ColorPickerFormatSelect({ className }: { className?: string }) {
  return (
    <ArkColorPicker.FormatSelect
      className={cn(
        "h-9 rounded-md border bg-background px-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Channel Input (hex / channel text input)                                   */
/* -------------------------------------------------------------------------- */

function ColorPickerInput({ className }: { className?: string }) {
  return (
    <ArkColorPicker.ChannelInput
      channel="hex"
      className={cn(
        "h-9 w-full rounded-md border bg-background px-2 font-mono text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Value Swatch                                                               */
/* -------------------------------------------------------------------------- */

function ColorPickerSwatch({ className }: { className?: string }) {
  return (
    <ArkColorPicker.ValueSwatch
      className={cn("rounded-sm border shadow-sm", className)}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                    */
/* -------------------------------------------------------------------------- */

export {
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerInlineContent,
  ColorPickerArea,
  ColorPickerHueSlider,
  ColorPickerAlphaSlider,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerInput,
  ColorPickerSwatch,
}
