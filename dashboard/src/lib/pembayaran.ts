import { differenceInDays } from "date-fns"

const DENDA_HARIAN_RATE = 0.001 // 0.1% per hari dari sisa pokok

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function hitungDenda(sisaPinjaman: number, tanggalJatuhTempo: Date, tanggalBayar: Date) {
  const hariTelat = differenceInDays(startOfDay(tanggalBayar), startOfDay(tanggalJatuhTempo))
  if (hariTelat <= 0) return 0
  return Math.round(sisaPinjaman * DENDA_HARIAN_RATE * hariTelat)
}
