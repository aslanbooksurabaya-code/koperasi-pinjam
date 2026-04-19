import { z } from "zod"

export const nasabahSchema = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit").regex(/^\d+$/, "NIK hanya angka"),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  kotaKab: z.string().optional(),
  noHp: z.string().regex(/^08\d{8,11}$/, "Format HP: 08xxxxxxxxxx"),
  pekerjaan: z.string().optional(),
  namaUsaha: z.string().optional(),
  kelompokId: z.string().optional(),
  kolektorId: z.string().optional(),
  status: z.enum(["AKTIF", "NON_AKTIF", "KELUAR"]).default("AKTIF"),
})

export type NasabahInput = z.infer<typeof nasabahSchema>
