export interface DateBound {
  mode: "fixed" | "dynamic"
  fixed_date?: string | null
  offset_sign?: "+" | "-"
  offset_amount?: number | null
  offset_unit?: "d" | "m" | "y"
}

export interface DateConfig {
  calendar_style?: "label" | "dropdown"
  min_date?: DateBound | null
  max_date?: DateBound | null
}

export function resolveDateBound(bound: DateBound | null | undefined): Date | undefined {
  if (!bound) return undefined

  if (bound.mode === "fixed") {
    if (!bound.fixed_date) return undefined
    const d = new Date(bound.fixed_date + "T00:00:00")
    return isNaN(d.getTime()) ? undefined : d
  }

  if (bound.mode === "dynamic") {
    const amount = bound.offset_amount ?? 0
    if (amount === 0 && !bound.offset_sign) return undefined
    const sign = bound.offset_sign === "-" ? -1 : 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (bound.offset_unit) {
      case "m":
        today.setMonth(today.getMonth() + sign * amount)
        break
      case "y":
        today.setFullYear(today.getFullYear() + sign * amount)
        break
      case "d":
      default:
        today.setDate(today.getDate() + sign * amount)
        break
    }
    return today
  }

  return undefined
}
