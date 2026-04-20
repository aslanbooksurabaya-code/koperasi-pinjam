export type AccountingMode = "SIMPLE" | "PROPER"

export const ACCOUNTING_MODE_KEY = "ACCOUNTING_MODE"

export const DEFAULT_ACCOUNTING_MODE: AccountingMode = "SIMPLE"

const ACCOUNTING_MODES: AccountingMode[] = ["SIMPLE", "PROPER"]

export function normalizeAccountingMode(value?: string | null): AccountingMode {
  const normalized = value?.trim().toUpperCase()
  if (normalized === "SIMPLE" || normalized === "PROPER") return normalized
  return DEFAULT_ACCOUNTING_MODE
}

export function isAccountingMode(value: unknown): value is AccountingMode {
  return typeof value === "string" && ACCOUNTING_MODES.includes(value as AccountingMode)
}
