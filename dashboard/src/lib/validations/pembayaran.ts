import { z } from "zod"

export const pembayaranSchema = z.object({
  pinjamanId: z.string().min(1),
  jadwalAngsuranId: z.string().optional(),
  jumlahBayar: z.coerce.number().min(1, "Jumlah harus diisi"),
  mode: z.enum(["FULL", "PARSIAL", "PELUNASAN"]).default("FULL"),
  metode: z.enum(["TUNAI", "TRANSFER"]).default("TUNAI"),
  catatan: z.string().optional(),
})

export type PembayaranInput = z.infer<typeof pembayaranSchema>

export const pembatalanPembayaranSchema = z.object({
  pembayaranId: z.string().min(1),
  alasan: z.string().min(5, "Alasan minimal 5 karakter"),
})
