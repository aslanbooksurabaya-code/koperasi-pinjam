import { z } from "zod"

export const pembayaranSchema = z.object({
  pinjamanId: z.string().min(1),
  jadwalAngsuranId: z.string().optional(), // jika membayar angsuran spesifik
  jumlahBayar: z.coerce.number().min(1, "Jumlah harus diisi"),
  metode: z.enum(["TUNAI", "TRANSFER"]).default("TUNAI"),
  catatan: z.string().optional(),
})

export type PembayaranInput = z.infer<typeof pembayaranSchema>
