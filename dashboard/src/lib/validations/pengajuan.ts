import { z } from "zod"

export const pengajuanSchema = z.object({
  nasabahId: z.string().min(1, "Pilih nasabah"),
  kelompokId: z.string().optional(),
  jenisPinjaman: z.enum(["REGULAR", "MIKRO", "USAHA"]).default("REGULAR"),
  plafonDiajukan: z.coerce.number().min(500000, "Minimal Rp 500.000").max(100000000, "Maksimal Rp 100 juta"),
  tenor: z.coerce.number().min(1).max(36),
  bungaPerBulan: z.coerce.number().min(0.1).max(5),
  tujuanPinjaman: z.string().min(5, "Tujuan harus diisi"),
  agunan: z.string().optional(),
})

export type PengajuanInput = z.infer<typeof pengajuanSchema>

export const approvalSchema = z.object({
  pengajuanId: z.string(),
  aksi: z.enum(["SETUJU", "TOLAK"]),
  plafonDisetujui: z.coerce.number().optional(),
  catatanApproval: z.string().optional(),
})

export type ApprovalInput = z.infer<typeof approvalSchema>

export const pencairanSchema = z.object({
  pengajuanId: z.string(),
  potonganAdmin: z.coerce.number().min(0).default(0),
  potonganProvisi: z.coerce.number().min(0).default(0),
  tanggalCair: z.string().min(1, "Tanggal cair wajib diisi"),
})

export type PencairanInput = z.infer<typeof pencairanSchema>
