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
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: kas.id,
    action: "CASH",
    afterData: { jenis: kas.jenis, kategori: kas.kategori, jumlah: kas.jumlah.toString() },
  })
  return { success: true }
}

export async function updateKas(id: string, input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses." }
  }

  const parsed = kasSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tanggal, jumlah, ...rest } = parsed.data

  const existing = await prisma.kasTransaksi.findUnique({ where: { id } })
  if (!existing) return { error: "Data tidak ditemukan." }

  const kas = await prisma.kasTransaksi.update({
    where: { id },
    data: {
      ...rest,
      jumlah: new Prisma.Decimal(jumlah),
      tanggal: tanggal ? new Date(tanggal) : new Date(),
    },
  })

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: kas.id,
    action: "UPDATE",
    afterData: { jenis: kas.jenis, kategori: kas.kategori, jumlah: kas.jumlah.toString() },
  })
  return { success: true }
}

export async function deleteKas(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses." }
  }

  const existing = await prisma.kasTransaksi.findUnique({ where: { id } })
  if (!existing) return { error: "Data tidak ditemukan." }

  await prisma.kasTransaksi.delete({ where: { id } })

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: id,
    action: "DELETE",
    afterData: { jenis: existing.jenis, jumlah: existing.jumlah.toString() },
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

export async function getLabaRugiSummary(params?: { month?: string; year?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const now = new Date()
  const month = Number(params?.month ?? now.getMonth() + 1)
  const year = Number(params?.year ?? now.getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const [pendapatanRows, bebanRows] = await Promise.all([
    prisma.kasTransaksi.groupBy({
      by: ["kategori"],
      where: {
        jenis: "MASUK",
        tanggal: { gte: startDate, lt: endDate },
      },
      _sum: { jumlah: true },
    }),
    prisma.kasTransaksi.groupBy({
      by: ["kategori"],
      where: {
        jenis: "KELUAR",
        tanggal: { gte: startDate, lt: endDate },
      },
      _sum: { jumlah: true },
    }),
  ])

  const pendapatan = pendapatanRows.map((r) => ({
    label: r.kategori,
    jumlah: Number(r._sum.jumlah ?? 0),
  }))

  const beban = bebanRows.map((r) => ({
    label: r.kategori,
    jumlah: Number(r._sum.jumlah ?? 0),
  }))

  const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.jumlah, 0)
  const totalBeban = beban.reduce((sum, b) => sum + b.jumlah, 0)
  const laba = totalPendapatan - totalBeban

  return {
    month,
    year,
    pendapatan,
    beban,
    totalPendapatan,
    totalBeban,
    laba,
  }
}

type TransaksiPerUserFilter = {
  month?: string
  year?: string
  userId?: string
}

export async function getTransaksiPerUserReport(params?: TransaksiPerUserFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const now = new Date()
  const month = Number(params?.month ?? now.getMonth() + 1)
  const year = Number(params?.year ?? now.getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(params?.userId ? { id: params.userId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      roles: { select: { role: true } },
    },
    orderBy: { name: "asc" },
  })

  const [kasRows, bayarRows] = await Promise.all([
    prisma.kasTransaksi.groupBy({
      by: ["inputOlehId", "jenis"],
      where: {
        tanggal: { gte: startDate, lt: endDate },
      },
      _sum: { jumlah: true },
      _count: { id: true },
    }),
    prisma.pembayaran.groupBy({
      by: ["inputOlehId"],
      where: {
        isBatalkan: false,
        tanggalBayar: { gte: startDate, lt: endDate },
      },
      _sum: { totalBayar: true },
      _count: { id: true },
    }),
  ])

  const kasMap = new Map<string, { masuk: number; keluar: number; totalKas: number }>()
  for (const row of kasRows) {
    const item = kasMap.get(row.inputOlehId) ?? { masuk: 0, keluar: 0, totalKas: 0 }
    if (row.jenis === "MASUK") item.masuk += Number(row._sum.jumlah ?? 0)
    if (row.jenis === "KELUAR") item.keluar += Number(row._sum.jumlah ?? 0)
    item.totalKas += row._count.id
    kasMap.set(row.inputOlehId, item)
  }

  const bayarMap = new Map<string, { totalPembayaran: number; jumlahPembayaran: number }>()
  for (const row of bayarRows) {
    bayarMap.set(row.inputOlehId, {
      totalPembayaran: Number(row._sum.totalBayar ?? 0),
      jumlahPembayaran: row._count.id,
    })
  }

  const data = users.map((u) => {
    const kas = kasMap.get(u.id) ?? { masuk: 0, keluar: 0, totalKas: 0 }
    const bayar = bayarMap.get(u.id) ?? { totalPembayaran: 0, jumlahPembayaran: 0 }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      roles: u.roles.map((r) => r.role),
      kasMasuk: kas.masuk,
      kasKeluar: kas.keluar,
      totalKasTransaksi: kas.totalKas,
      totalPembayaran: bayar.totalPembayaran,
      jumlahPembayaran: bayar.jumlahPembayaran,
      totalNominalAktivitas: kas.masuk + kas.keluar + bayar.totalPembayaran,
    }
  })

  const summary = data.reduce(
    (acc, row) => {
      acc.kasMasuk += row.kasMasuk
      acc.kasKeluar += row.kasKeluar
      acc.totalPembayaran += row.totalPembayaran
      acc.totalKasTransaksi += row.totalKasTransaksi
      acc.jumlahPembayaran += row.jumlahPembayaran
      return acc
    },
    {
      kasMasuk: 0,
      kasKeluar: 0,
      totalPembayaran: 0,
      totalKasTransaksi: 0,
      jumlahPembayaran: 0,
    }
  )

  return {
    month,
    year,
    data,
    summary,
    filterOptions: users.map((u) => ({ id: u.id, name: u.name })),
  }
}
