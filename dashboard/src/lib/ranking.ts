export type RankingGrade = "A" | "B" | "C" | "D"

export type RankingConfig = {
  bMaxTelat: number
  bMaxKurang: number
  cMaxTelat: number
  cMaxKurang: number
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  bMaxTelat: 1,
  bMaxKurang: 1_000_000,
  cMaxTelat: 3,
  cMaxKurang: 3_000_000,
}

export function computeRanking(input: { telat: number; kurangAngsuran: number }, cfg?: Partial<RankingConfig>): RankingGrade {
  const config: RankingConfig = { ...DEFAULT_RANKING_CONFIG, ...(cfg ?? {}) }
  const telat = Math.max(0, Math.trunc(input.telat))
  const kurang = Math.max(0, Number(input.kurangAngsuran) || 0)

  if (telat === 0 && kurang <= 0) return "A"
  if (telat <= config.bMaxTelat && kurang < config.bMaxKurang) return "B"
  if (telat <= config.cMaxTelat && kurang < config.cMaxKurang) return "C"
  return "D"
}

