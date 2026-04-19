import { z } from "zod"

export const kelompokSchema = z.object({
  kode: z.string().min(3, "Kode kelompok minimal 3 karakter").max(20, "Kode terlalu panjang"),
  nama: z.string().min(3, "Nama kelompok minimal 3 karakter").max(120, "Nama terlalu panjang"),
  ketua: z.string().optional(),
  wilayah: z.string().optional(),
  jadwalPertemuan: z.string().optional(),
})

export type KelompokInput = z.infer<typeof kelompokSchema>
