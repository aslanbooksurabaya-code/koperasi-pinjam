import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isPrismaDecimalWithPlaces(
  value: unknown,
): value is { toDecimalPlaces: (...args: unknown[]) => unknown } {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    "d" in record &&
    "e" in record &&
    "s" in record &&
    typeof record.toDecimalPlaces === "function"
  )
}

function isDecimalWithToNumber(value: unknown): value is { toNumber: () => unknown } {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (typeof record.toNumber !== "function") return false

  const ctorName = (value as { constructor?: { name?: unknown } }).constructor?.name
  return ctorName === "Decimal"
}

export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return data
  if (typeof data !== "object") return data

  if (data instanceof Date) {
    return data
  }

  // Prisma Decimal-like objects are not directly serializable in RSC payloads.
  if (isPrismaDecimalWithPlaces(data) || isDecimalWithToNumber(data)) {
    return Number(data) as unknown as T
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item)) as unknown as T
  }

  // Handle plain objects
  const serialized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    serialized[key] = serializeData(value)
  }
  return serialized as unknown as T
}
