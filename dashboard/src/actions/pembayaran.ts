"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hitungDenda } from "@/lib/pembayaran"
import { Prisma, RoleType, ApprovalEntityType, ApprovalStatus } from "@prisma/client"
import { requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"
import { computeRanking } from "@/lib/ranking"
import { getRankingConfig } from "@/actions/settings"

type MetodePembayaran = "TUNAI" | "TRANSFER"
type ModePembayaran = "FULL" | "PARSIAL" | "PELUNASAN"

function jadwalTag(jadwalAngsuranId: string) {
  return `[JADWAL:${jadwalAngsuranId}]`
}

async function getPaidForJadwal(pinjamanId: string, jadwalAngsuranId: string) {
  const tag = jadwalTag(jadwalAngsuranId)
  const existing = await prisma.pembayaran.findMany({
    where: {
      pinjamanId,
      isBatalkan: false,
      catatan: { contains: tag },
    },
    select: {
      pokok: true,
      bunga: true,
      denda: true,
      totalBayar: true,
    },
  })

  return existing.reduce(
    (acc, row) => {
      acc.pokok += Number(row.pokok)
      acc.bunga += Number(row.bunga)
      acc.denda += Number(row.denda)
      acc.total += Number(row.totalBayar)
      return acc
    },
    { pokok: 0, bunga: 0, denda: 0, total: 0 }
  )
}

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
  mode?: ModePembayaran
  jumlahBayar?: number
  metode: MetodePembayaran
  buktiBayarUrl?: string
  catatan?: string
  tanggalBayar?: Date | string
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
  if (jadwal.sudahDibayar && input.mode !== "PELUNASAN") {
    return { error: "Angsuran ini sudah dibayar." }
  }

  const mode: ModePembayaran = input.mode ?? "FULL"
  const tanggalBayar = input.tanggalBayar ? new Date(input.tanggalBayar) : new Date()
  const sisaPinjaman = Number(jadwal.pinjaman.sisaPinjaman)

  const paid = await getPaidForJadwal(jadwal.pinjamanId, jadwal.id)

  const dendaHariIni = hitungDenda(sisaPinjaman, jadwal.tanggalJatuhTempo, tanggalBayar)
  const dendaSisa = Math.max(0, dendaHariIni - paid.denda)
  const pokokSisa = Math.max(0, Number(jadwal.pokok) - paid.pokok)
  const bungaSisa = Math.max(0, Number(jadwal.bunga) - paid.bunga)
  const totalTagihanSisa = pokokSisa + bungaSisa + dendaSisa

  if (totalTagihanSisa <= 0 && mode !== "PELUNASAN") {
    return { error: "Tidak ada sisa tagihan untuk angsuran ini." }
  }

  const requestedJumlah = Number(input.jumlahBayar ?? 0)

  const jumlahBayar =
    mode === "PELUNASAN"
      ? sisaPinjaman + dendaSisa
      : mode === "PARSIAL"
        ? requestedJumlah
        : totalTagihanSisa

  if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
    return { error: "Jumlah pembayaran tidak valid." }
  }
  if (mode === "PARSIAL" && jumlahBayar >= totalTagihanSisa) {
    return { error: "Untuk mode parsial, jumlah harus lebih kecil dari total tagihan sisa." }
  }
  if (mode !== "PELUNASAN" && jumlahBayar > totalTagihanSisa) {
    return { error: "Jumlah pembayaran melebihi total tagihan sisa." }
  }

  const alokasiDenda = mode === "PELUNASAN" ? dendaSisa : Math.min(jumlahBayar, dendaSisa)
  const sisaSetelahDenda = jumlahBayar - alokasiDenda
  const alokasiBunga = mode === "PELUNASAN" ? 0 : Math.min(sisaSetelahDenda, bungaSisa)
  const sisaSetelahBunga = sisaSetelahDenda - alokasiBunga
  const alokasiPokok = mode === "PELUNASAN" ? sisaPinjaman : Math.min(sisaSetelahBunga, pokokSisa)

  const metaCatatan = [jadwalTag(jadwal.id), `mode=${mode}`]
  if (input.catatan?.trim()) metaCatatan.push(input.catatan.trim())
  const catatanFinal = metaCatatan.join(" ")

  const result = await prisma.$transaction(async (tx) => {
    const pembayaran = await tx.pembayaran.create({
      data: {
        pinjamanId: jadwal.pinjamanId,
        tanggalBayar,
        pokok: new Prisma.Decimal(alokasiPokok),
        bunga: new Prisma.Decimal(alokasiBunga),
        denda: new Prisma.Decimal(alokasiDenda),
        totalBayar: new Prisma.Decimal(jumlahBayar),
        metode: input.metode,
        buktiBayarUrl: input.buktiBayarUrl,
        catatan: catatanFinal,
        inputOlehId: userId,
      },
    })

    let sisaBaru = Math.max(0, sisaPinjaman - alokasiPokok)

    if (mode === "PELUNASAN") {
      await tx.jadwalAngsuran.updateMany({
        where: {
          pinjamanId: jadwal.pinjamanId,
          sudahDibayar: false,
        },
        data: {
          sudahDibayar: true,
          tanggalBayar,
        },
      })
      sisaBaru = 0
    } else {
      const lunasAngsuran =
        pokokSisa - alokasiPokok <= 0.0001 &&
        bungaSisa - alokasiBunga <= 0.0001 &&
        dendaSisa - alokasiDenda <= 0.0001

      if (lunasAngsuran) {
        await tx.jadwalAngsuran.update({
          where: { id: jadwal.id },
          data: { sudahDibayar: true, tanggalBayar },
        })
      }
    }

    await tx.pinjaman.update({
      where: { id: jadwal.pinjamanId },
      data: {
        sisaPinjaman: new Prisma.Decimal(sisaBaru),
        status: sisaBaru <= 0 ? "LUNAS" : "AKTIF",
        updatedAt: new Date(),
      },
    })

    await tx.kasTransaksi.create({
      data: {
        jenis: "MASUK",
        kategori: mode === "PELUNASAN" ? "PELUNASAN" : "ANGSURAN",
        deskripsi: `${mode} angsuran ke-${jadwal.angsuranKe} ${jadwal.pinjaman.nomorKontrak}`,
        jumlah: new Prisma.Decimal(jumlahBayar),
        kasJenis: input.metode === "TRANSFER" ? "BANK" : "TUNAI",
        inputOlehId: userId,
        tanggal: tanggalBayar,
        referensiId: pembayaran.id,
      },
    })

    return {
      pembayaranId: pembayaran.id,
      denda: alokasiDenda,
      totalBayar: jumlahBayar,
      pokok: alokasiPokok,
      bunga: alokasiBunga,
      mode,
      sisaTagihan: Math.max(0, totalTagihanSisa - jumlahBayar),
    }
  })

  revalidatePath("/pembayaran")
  revalidatePath("/monitoring/tunggakan")

  await writeAuditLog({
    actorId: userId,
    entityType: "PEMBAYARAN",
    entityId: result.pembayaranId,
    action: "PAYMENT",
    metadata: {
      jadwalAngsuranId: jadwal.id,
      angsuranKe: jadwal.angsuranKe,
      totalBayar: result.totalBayar,
      pokok: result.pokok,
      bunga: result.bunga,
      denda: result.denda,
      mode: result.mode,
      metode: input.metode,
      buktiBayarUrl: input.buktiBayarUrl ?? null,
      sisaTagihan: result.sisaTagihan,
    },
  })

  return { success: true, ...result }
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

export async function getRecentPembayaran(limit = 20, query?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: Prisma.PembayaranWhereInput = { isBatalkan: false }
  
  if (query) {
    where.OR = [
      { nomorTransaksi: { contains: query, mode: "insensitive" } },
      {
        pinjaman: {
          nomorKontrak: { contains: query, mode: "insensitive" }
        }
      },
      {
        pinjaman: {
          pengajuan: {
            nasabah: {
              namaLengkap: { contains: query, mode: "insensitive" }
            }
          }
        }
      }
    ]
  }

  return prisma.pembayaran.findMany({
    where,
    orderBy: { tanggalBayar: "desc" },
    take: limit,
    include: {
      pinjaman: {
        select: {
          nomorKontrak: true,
          pengajuan: {
            select: {
              nasabah: {
                select: { namaLengkap: true },
              },
            },
          },
        },
      },
      inputOleh: { select: { name: true } },
    },
  })
}

export async function getHistoryPembayaranNasabahReport() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const rankingConfig = await getRankingConfig()

  const nasabahList = await prisma.nasabah.findMany({
    include: {
      kelompok: { select: { nama: true } },
      pengajuan: {
        include: {
          pinjaman: {
            include: {
              jadwalAngsuran: {
                orderBy: { angsuranKe: "asc" },
              },
              pembayaran: {
                where: { isBatalkan: false },
                select: {
                  catatan: true,
                  totalBayar: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { namaLengkap: "asc" },
  })

  return nasabahList.map((nasabah) => {
    let totalTagihan = 0
    let totalDibayar = 0
    let selesai = 0
    let telat = 0
    let belumJatuhTempo = 0
    let belumBayar = 0
    let lunas = false

    const pinjamanAktif = nasabah.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    for (const pinjaman of pinjamanAktif) {
      lunas = lunas || pinjaman.status === "LUNAS"
      const pembayaranTagMap = new Map<string, number>()

      for (const p of pinjaman.pembayaran) {
        const tags = p.catatan?.match(/\[JADWAL:([^\]]+)\]/g) ?? []
        for (const rawTag of tags) {
          const jadwalId = rawTag.replace("[JADWAL:", "").replace("]", "")
          const prev = pembayaranTagMap.get(jadwalId) ?? 0
          pembayaranTagMap.set(jadwalId, prev + Number(p.totalBayar))
        }
      }

      for (const jadwal of pinjaman.jadwalAngsuran) {
        const nominalTagihan = Number(jadwal.total)
        const bayarParsial = pembayaranTagMap.get(jadwal.id) ?? 0
        const bayarEfektif = jadwal.sudahDibayar ? nominalTagihan : Math.min(nominalTagihan, bayarParsial)

        totalTagihan += nominalTagihan
        totalDibayar += bayarEfektif

        if (jadwal.sudahDibayar || bayarEfektif >= nominalTagihan) {
          selesai += 1
          if (jadwal.tanggalBayar && jadwal.tanggalBayar > jadwal.tanggalJatuhTempo) {
            telat += 1
          }
          continue
        }

        if (jadwal.tanggalJatuhTempo > today) {
          belumJatuhTempo += 1
        } else {
          belumBayar += 1
          telat += 1
        }
      }
    }

    const kurangAngsuran = Math.max(0, totalTagihan - totalDibayar)

    const ranking = computeRanking({ telat, kurangAngsuran }, rankingConfig)

    return {
      nasabahId: nasabah.id,
      nomorAnggota: nasabah.nomorAnggota,
      namaLengkap: nasabah.namaLengkap,
      kelompok: nasabah.kelompok?.nama ?? "-",
      totalTagihan,
      totalDibayar,
      kurangAngsuran,
      selesai,
      telat,
      belumJatuhTempo,
      belumBayar,
      lunas,
      ranking,
    }
  })
}

type LaporanTransaksiUserFilter = {
  kelompokId?: string
  search?: string
}

export async function getLaporanTransaksiUserReport(params?: LaporanTransaksiUserFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const rankingConfig = await getRankingConfig()

  const [kelompokOptions, nasabahList] = await Promise.all([
    prisma.kelompok.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.nasabah.findMany({
      where: {
        ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
        ...(params?.search
          ? {
              OR: [
                { namaLengkap: { contains: params.search, mode: "insensitive" as const } },
                { nomorAnggota: { contains: params.search, mode: "insensitive" as const } },
                { nik: { contains: params.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        kelompok: { select: { nama: true } },
        pengajuan: {
          include: {
            pinjaman: {
              include: {
                jadwalAngsuran: {
                  orderBy: { angsuranKe: "asc" },
                },
                pembayaran: {
                  where: { isBatalkan: false },
                  select: {
                    catatan: true,
                    totalBayar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { namaLengkap: "asc" },
    }),
  ])

  const data = nasabahList.map((nasabah) => {
    let totalTagihan = 0
    let totalDibayar = 0
    let selesai = 0
    let telat = 0
    let belumJatuhTempo = 0
    let belumBayar = 0
    let outstanding = 0
    let anomaliPembayaran = 0
    let anomaliNominal = 0

    const pinjamanAktif = nasabah.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    for (const pinjaman of pinjamanAktif) {
      outstanding += Number(pinjaman.sisaPinjaman)
      const pembayaranTagMap = new Map<string, number>()

      for (const p of pinjaman.pembayaran) {
        const tags = p.catatan?.match(/\[JADWAL:([^\]]+)\]/g) ?? []
        if (tags.length === 0) {
          anomaliPembayaran += 1
          anomaliNominal += Number(p.totalBayar)
          continue
        }
        for (const rawTag of tags) {
          const jadwalId = rawTag.replace("[JADWAL:", "").replace("]", "")
          const prev = pembayaranTagMap.get(jadwalId) ?? 0
          pembayaranTagMap.set(jadwalId, prev + Number(p.totalBayar))
        }
      }

      for (const jadwal of pinjaman.jadwalAngsuran) {
        const nominalTagihan = Number(jadwal.total)
        const bayarParsial = pembayaranTagMap.get(jadwal.id) ?? 0
        const bayarEfektif = jadwal.sudahDibayar ? nominalTagihan : Math.min(nominalTagihan, bayarParsial)

        totalTagihan += nominalTagihan
        totalDibayar += bayarEfektif

        if (jadwal.sudahDibayar || bayarEfektif >= nominalTagihan) {
          selesai += 1
          if (jadwal.tanggalBayar && jadwal.tanggalBayar > jadwal.tanggalJatuhTempo) {
            telat += 1
          }
          continue
        }

        if (jadwal.tanggalJatuhTempo > today) {
          belumJatuhTempo += 1
        } else {
          belumBayar += 1
          telat += 1
        }
      }
    }

    const kurangAngsuran = Math.max(0, totalTagihan - totalDibayar)
    const ranking = computeRanking({ telat, kurangAngsuran }, rankingConfig)

    return {
      nasabahId: nasabah.id,
      nomorAnggota: nasabah.nomorAnggota,
      namaLengkap: nasabah.namaLengkap,
      kelompok: nasabah.kelompok?.nama ?? "-",
      totalTagihan,
      totalDibayar,
      kurangAngsuran,
      outstanding,
      selesai,
      telat,
      belumJatuhTempo,
      belumBayar,
      ranking,
      anomaliPembayaran,
      anomaliNominal,
    }
  })

  const summary = data.reduce(
    (acc, row) => {
      acc.totalTagihan += row.totalTagihan
      acc.totalDibayar += row.totalDibayar
      acc.kurang += row.kurangAngsuran
      acc.outstanding += row.outstanding
      acc.anomaliPembayaran += row.anomaliPembayaran
      acc.anomaliNominal += row.anomaliNominal
      if (row.ranking === "A") acc.rankA += 1
      return acc
    },
    { totalTagihan: 0, totalDibayar: 0, kurang: 0, outstanding: 0, rankA: 0, anomaliPembayaran: 0, anomaliNominal: 0 }
  )

  return {
    data,
    summary,
    kelompokOptions,
  }
}

export async function getPembayaranById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.pembayaran.findUnique({
    where: { id },
    include: {
      pinjaman: {
        include: {
          pengajuan: {
            include: {
              nasabah: { select: { namaLengkap: true, nomorAnggota: true } },
              kelompok: { select: { nama: true } },
            },
          },
        },
      },
      inputOleh: { select: { name: true, id: true } },
    },
  })
}

export async function requestPembatalanPembayaran(input: { pembayaranId: string; alasan: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.TELLER, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk meminta pembatalan." }
  }

  const pembayaran = await prisma.pembayaran.findUnique({ where: { id: input.pembayaranId } })
  if (!pembayaran) return { error: "Data pembayaran tidak ditemukan." }
  if (pembayaran.isBatalkan) return { error: "Pembayaran sudah dibatalkan." }

  const pending = await prisma.approvalLog.findFirst({
    where: {
      entityType: ApprovalEntityType.PEMBAYARAN,
      entityId: input.pembayaranId,
      status: ApprovalStatus.PENDING,
    },
    select: { id: true },
  })
  if (pending) return { error: "Sudah ada approval pembatalan yang masih pending." }

  await prisma.approvalLog.create({
    data: {
      entityType: ApprovalEntityType.PEMBAYARAN,
      entityId: input.pembayaranId,
      status: ApprovalStatus.PENDING,
      catatan: input.alasan,
      requestedById: userId,
    },
  })

  await writeAuditLog({
    actorId: userId,
    entityType: "PEMBAYARAN",
    entityId: input.pembayaranId,
    action: "UPDATE",
    metadata: {
      requestType: "CANCEL_APPROVAL",
      alasan: input.alasan,
    },
  })

  revalidatePath(`/pembayaran/${input.pembayaranId}/pembatalan`)
  return { success: true }
}

export async function getPembatalanApprovalList(pembayaranId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.approvalLog.findMany({
    where: {
      entityType: ApprovalEntityType.PEMBAYARAN,
      entityId: pembayaranId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  })
}

export async function approvePembatalanPembayaran(input: {
  approvalId: string
  action: "APPROVE" | "REJECT"
  catatan?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Hanya manager/admin/pimpinan yang dapat menyetujui pembatalan." }
  }

  const approval = await prisma.approvalLog.findUnique({
    where: { id: input.approvalId },
    include: {
      requestedBy: { select: { id: true, name: true } },
    },
  })

  if (!approval || approval.entityType !== ApprovalEntityType.PEMBAYARAN) {
    return { error: "Approval pembayaran tidak ditemukan." }
  }
  if (approval.status !== ApprovalStatus.PENDING) {
    return { error: "Approval sudah diproses sebelumnya." }
  }

  if (input.action === "REJECT") {
    await prisma.approvalLog.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.REJECTED,
        approvedById: userId,
        catatan: input.catatan ? `${approval.catatan ?? ""}\nReject: ${input.catatan}`.trim() : approval.catatan,
      },
    })

    await writeAuditLog({
      actorId: userId,
      entityType: "PEMBAYARAN",
      entityId: approval.entityId,
      action: "REJECT",
      metadata: {
        approvalId: approval.id,
        catatan: input.catatan,
      },
    })

    revalidatePath(`/pembayaran/${approval.entityId}/pembatalan`)
    return { success: true }
  }

  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id: approval.entityId },
    include: { pinjaman: true },
  })
  if (!pembayaran) return { error: "Pembayaran tidak ditemukan." }
  if (pembayaran.isBatalkan) return { error: "Pembayaran sudah dibatalkan." }

  await prisma.$transaction(async (tx) => {
    await tx.pembayaran.update({
      where: { id: pembayaran.id },
      data: {
        isBatalkan: true,
        alasanBatal: input.catatan ?? approval.catatan ?? "Pembatalan disetujui manager",
      },
    })

    const tagMatch = pembayaran.catatan?.match(/\[JADWAL:([^\]]+)\]/)
    const jadwalId = tagMatch?.[1]
    if (jadwalId) {
      await tx.jadwalAngsuran.update({
        where: { id: jadwalId },
        data: {
          sudahDibayar: false,
          tanggalBayar: null,
        },
      })
    }

    const sisaBaru = Number(pembayaran.pinjaman.sisaPinjaman) + Number(pembayaran.pokok)
    await tx.pinjaman.update({
      where: { id: pembayaran.pinjamanId },
      data: {
        sisaPinjaman: new Prisma.Decimal(sisaBaru),
        status: sisaBaru <= 0 ? "LUNAS" : "AKTIF",
      },
    })

    await tx.kasTransaksi.create({
      data: {
        jenis: "KELUAR",
        kategori: "PEMBATALAN_ANGSURAN",
        deskripsi: `Pembatalan pembayaran ${pembayaran.nomorTransaksi}`,
        jumlah: pembayaran.totalBayar,
        kasJenis: pembayaran.metode === "TRANSFER" ? "BANK" : "TUNAI",
        inputOlehId: userId,
        referensiId: pembayaran.id,
      },
    })

    await tx.approvalLog.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedById: userId,
        catatan: input.catatan ? `${approval.catatan ?? ""}\nApprove: ${input.catatan}`.trim() : approval.catatan,
      },
    })
  })

  await writeAuditLog({
    actorId: userId,
    entityType: "PEMBAYARAN",
    entityId: pembayaran.id,
    action: "APPROVE",
    metadata: {
      approvalId: approval.id,
      requestBy: approval.requestedBy.name,
      totalBayar: Number(pembayaran.totalBayar),
      pokokRevert: Number(pembayaran.pokok),
      catatan: input.catatan,
    },
  })

  revalidatePath("/pembayaran")
  revalidatePath("/monitoring/tunggakan")
  revalidatePath(`/pembayaran/${pembayaran.id}/pembatalan`)

  return { success: true }
}

export async function editPembayaranMetadata(input: {
  id: string
  tanggalBayar?: string
  metode?: MetodePembayaran
  buktiBayarUrl?: string
  catatan?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.TELLER])
  } catch {
    return { error: "Tidak memiliki hak akses untuk mengedit." }
  }

  const existing = await prisma.pembayaran.findUnique({ where: { id: input.id } })
  if (!existing) return { error: "Transaksi tidak ditemukan." }
  if (existing.isBatalkan) return { error: "Transaksi batal tidak bisa diedit." }

  const updateData: any = {}
  if (input.tanggalBayar) updateData.tanggalBayar = new Date(input.tanggalBayar)
  if (input.metode) updateData.metode = input.metode
  if (input.buktiBayarUrl !== undefined) updateData.buktiBayarUrl = input.buktiBayarUrl
  if (input.catatan !== undefined) updateData.catatan = input.catatan

  if (Object.keys(updateData).length > 0) {
    await prisma.pembayaran.update({
      where: { id: input.id },
      data: updateData
    })
  }

  revalidatePath("/pembayaran")
  return { success: true }
}
