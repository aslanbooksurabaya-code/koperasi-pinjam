export const DEFAULT_TIME_ZONE = "Asia/Jakarta"

export const TIME_ZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Jakarta", label: "WIB (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT (UTC+9)" },
  { value: "UTC", label: "UTC" },
]

export function normalizeTimeZone(tz?: string) {
  return tz?.trim() ? tz.trim() : DEFAULT_TIME_ZONE
}

type DateInput = Date | string | number | null | undefined

export function formatDateId(date: DateInput, opts?: { timeZone?: string }) {
  if (!date) return "—"
  const timeZone = normalizeTimeZone(opts?.timeZone)
  return new Intl.DateTimeFormat("id-ID", { timeZone, day: "2-digit", month: "short", year: "numeric" }).format(new Date(date))
}

export function formatDateTimeId(date: DateInput, opts?: { timeZone?: string }) {
  if (!date) return "—"
  const timeZone = normalizeTimeZone(opts?.timeZone)
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(date))
}

export function formatTimeId(date: DateInput, opts?: { timeZone?: string }) {
  if (!date) return "—"
  const timeZone = normalizeTimeZone(opts?.timeZone)
  return new Intl.DateTimeFormat("id-ID", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(date))
}

