const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export function isUuid(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

export const UUID_REGEX = UUID_RE

