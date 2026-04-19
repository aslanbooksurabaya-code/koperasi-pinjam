"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma, RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"

const kasSchema = z.object({
  jenis: z.enum(["MASUK", "KELUAR"]),
  kategori: z.string().min(1),
  deskripsi: z.string().min(3),
  jumlah: z.coerce.number().min(1),
  kasJenis: z.enum(["TUNAI", "BANK"]).default("TUNAI"),
  tanggal: z.string().optional(),
})

export async function getKasHarian(tanggal?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const tgl = tanggal ? new Date(tanggal) : new Date()
  const startOfDay = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)

  const [transaksi, saldoAwal] = await Promise.all([
    prisma.kasTransaksi.findMany({
      where: { tanggal: { gte: startOfDay, lt: endOfDay } },
      orderBy: { tanggal: "desc" },
      include: { inputOleh: { select: { name: true } } },
    }),
    prisma.kasTransaksi.aggregate({
      where: { tanggal: { lt: startOfDay } },
      _sum: {
        jumlah: true,
      },
    }),
  ])

  const totalMasuk = transaksi.filter((t) => t.jenis === "MASUK").reduce((a, b) => a + Number(b.jumlah), 0)
  const totalKeluar = transaksi.filter((t) => t.jenis === "KELUAR").reduce((a, b) => a + Number(b.jumlah), 0)

  return { transaksi, totalMasuk, totalKeluar, saldoAwal: Number(saldoAwal._sum.jumlah ?? 0) }
}

export async function inputKas(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.TELLER])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk input transaksi kas." }
  }

  const parsed = kasSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tanggal, jumlah, ...rest } = parsed.data

  const kas = await prisma.kasTransaksi.create({
    data: {
      ...rest,
      jumlah: new Prisma.Decimal(jumlah),
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      inputOlehId: userId,
    },
  })

  revalidatePath("/kas")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: kas.id,
    action: "CASH",
    afterData: { jenis: kas.jenis, kategori: kas.kategori, jumlah: kas.jumlah.toString() },
  })
  return { success: true }
}

export async function getKasBulanan(bulan: number, tahun: number) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

  const data = await prisma.kasTransaksi.groupBy({
    by: ["jenis"],
    where: { tanggal: { gte: startDate, lte: endDate } },
    _sum: { jumlah: true },
    _count: { id: true },
  })

  return data
}
