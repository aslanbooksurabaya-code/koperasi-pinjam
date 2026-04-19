"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hitungDenda } from "@/lib/pembayaran"
import { Prisma, RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"

export async function getAngsuranJatuhTempo(pinjamanId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const where = pinjamanId
    ? { pinjamanId, sudahDibayar: false }
    : { sudahDibayar: false, tanggalJatuhTempo: { lte: today } }

  return prisma.jadwalAngsuran.findMany({
    where,
    orderBy: { tanggalJatuhTempo: "asc" },
    include: {
      pinjaman: {
        include: {
          pengajuan: {
            include: {
              nasabah: { select: { namaLengkap: true, nomorAnggota: true, noHp: true } },
              kelompok: { select: { nama: true } },
            },
          },
        },
      },
    },
  })
}

export async function inputPembayaran(input: {
  jadwalAngsuranId: string
  metode: "TUNAI" | "TRANSFER"
  catatan?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.TELLER])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk input pembayaran." }
  }

  const jadwal = await prisma.jadwalAngsuran.findUnique({
    where: { id: input.jadwalAngsuranId },
    include: {
      pinjaman: true,
    },
  })
  if (!jadwal) return { error: "Data angsuran tidak ditemukan." }
  if (jadwal.sudahDibayar) return { error: "Angsuran ini sudah dibayar." }

  const tanggalBayar = new Date()
  const sisaPinjaman = Number(jadwal.pinjaman.sisaPinjaman)
  const denda = hitungDenda(sisaPinjaman, jadwal.tanggalJatuhTempo, tanggalBayar)
  const pokok = Number(jadwal.pokok)
  const bunga = Number(jadwal.bunga)
  const totalBayar = pokok + bunga + denda

  // Semua dalam 1 transaksi DB
  await prisma.$transaction(async (tx) => {
    // 1. Buat record pembayaran
    await tx.pembayaran.create({
      data: {
        pinjamanId: jadwal.pinjamanId,
        tanggalBayar,
        pokok: new Prisma.Decimal(pokok),
        bunga: new Prisma.Decimal(bunga),
        denda: new Prisma.Decimal(denda),
        totalBayar: new Prisma.Decimal(totalBayar),
        metode: input.metode,
        catatan: input.catatan,
        inputOlehId: userId,
      },
    })

    // 2. Tandai jadwal sudah dibayar
    await tx.jadwalAngsuran.update({
      where: { id: jadwal.id },
      data: { sudahDibayar: true, tanggalBayar },
    })

    // 3. Kurangi sisa pinjaman
    const sisaBaru = Math.max(0, sisaPinjaman - pokok)
    await tx.pinjaman.update({
      where: { id: jadwal.pinjamanId },
      data: {
        sisaPinjaman: new Prisma.Decimal(sisaBaru),
        status: sisaBaru <= 0 ? "LUNAS" : "AKTIF",
        updatedAt: new Date(),
      },
    })

    // 4. Catat kas masuk
    await tx.kasTransaksi.create({
      data: {
        jenis: "MASUK",
        kategori: "ANGSURAN",
        deskripsi: `Angsuran ke-${jadwal.angsuranKe} ${jadwal.pinjaman.nomorKontrak}`,
        jumlah: new Prisma.Decimal(totalBayar),
        kasJenis: input.metode === "TRANSFER" ? "BANK" : "TUNAI",
        inputOlehId: userId,
        tanggal: tanggalBayar,
      },
    })
  })

  revalidatePath("/pembayaran")
  revalidatePath("/monitoring/tunggakan")
  await writeAuditLog({
    actorId: userId,
    entityType: "PEMBAYARAN",
    entityId: jadwal.pinjamanId,
    action: "PAYMENT",
    metadata: {
      jadwalAngsuranId: jadwal.id,
      angsuranKe: jadwal.angsuranKe,
      totalBayar,
      metode: input.metode,
    },
  })
  return { success: true, denda, totalBayar }
}

export async function getRiwayatPembayaran(pinjamanId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return prisma.pembayaran.findMany({
    where: { pinjamanId, isBatalkan: false },
    orderBy: { tanggalBayar: "desc" },
    include: { inputOleh: { select: { name: true } } },
  })
}
