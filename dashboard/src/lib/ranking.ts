export type RankingGrade = "A" | "B" | "C" | "D"

export type RankingConfig = {
  bMaxTelat: number
  bMaxTunggakan: number
  cMaxTelat: number
  cMaxTunggakan: number
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  bMaxTelat: 1,
  bMaxTunggakan: 1_000_000,
  cMaxTelat: 3,
  cMaxTunggakan: 3_000_000,
}

export function computeRanking(input: { telat: number; tunggakanNominal: number }, cfg?: Partial<RankingConfig>): RankingGrade {
  const config: RankingConfig = { ...DEFAULT_RANKING_CONFIG, ...(cfg ?? {}) }
  const telat = Math.max(0, Math.trunc(input.telat))
  const tunggakan = Math.max(0, Number(input.tunggakanNominal) || 0)

  if (telat === 0 && tunggakan <= 0) return "A"
  if (telat <= config.bMaxTelat && tunggakan < config.bMaxTunggakan) return "B"
  if (telat <= config.cMaxTelat && tunggakan < config.cMaxTunggakan) return "C"
  return "D"
}

export function explainRanking(input: { telat: number; tunggakanNominal: number }, cfg?: Partial<RankingConfig>) {
  const config: RankingConfig = { ...DEFAULT_RANKING_CONFIG, ...(cfg ?? {}) }
  const telat = Math.max(0, Math.trunc(input.telat))
  const tunggakan = Math.max(0, Number(input.tunggakanNominal) || 0)
  const grade = computeRanking({ telat, tunggakanNominal: tunggakan }, config)

  const rules = [
    `A: telat = 0 dan tunggakan = 0`,
    `B: telat <= ${config.bMaxTelat} dan tunggakan < Rp ${config.bMaxTunggakan.toLocaleString("id-ID")}`,
    `C: telat <= ${config.cMaxTelat} dan tunggakan < Rp ${config.cMaxTunggakan.toLocaleString("id-ID")}`,
    `D: selain itu`,
  ]

  return {
    grade,
    telat,
    tunggakanNominal: tunggakan,
    config,
    rules,
    summary: `Kondisi: telat ${telat}, tunggakan Rp ${tunggakan.toLocaleString("id-ID")} -> ranking ${grade}`,
  }
}
