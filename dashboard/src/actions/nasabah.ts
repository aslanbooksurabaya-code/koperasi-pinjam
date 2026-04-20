"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nasabahSchema, type NasabahInput } from "@/lib/validations/nasabah"
import { computeRanking } from "@/lib/ranking"
import { getRankingConfig } from "@/actions/settings"
import { serializeData } from "@/lib/utils"

function parseJadwalTags(catatan?: string | null) {
  return catatan?.match(/\[JADWAL:([^\]]+)\]/g) ?? []
}

// Helper: generate nomor anggota otomatis
async function generateNomorAnggota(): Promise<string> {
  const count = await prisma.nasabah.count()
  const seq = String(count + 1).padStart(4, "0")
  const year = new Date().getFullYear().toString().slice(2)
  return `N-${year}-${seq}`
}

export async function getNasabahList(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  kelompokId?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const now = new Date()
  const rankingConfig = await getRankingConfig()

  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where = {
    AND: [
      params.search
        ? {
            OR: [
              { namaLengkap: { contains: params.search, mode: "insensitive" as const } },
              { nik: { contains: params.search } },
              { nomorAnggota: { contains: params.search } },
            ],
          }
        : {},
      params.status ? { status: params.status as "AKTIF" | "NON_AKTIF" | "KELUAR" } : {},
      params.kelompokId ? { kelompokId: params.kelompokId } : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.nasabah.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: { select: { nama: true } },
        kolektor: { select: { name: true } },
        pengajuan: {
          select: {
            pinjaman: {
              select: {
                id: true,
                status: true,
                nomorKontrak: true,
                sisaPinjaman: true,
                jadwalAngsuran: {
                  select: {
                    id: true,
                    total: true,
                    sudahDibayar: true,
                    tanggalJatuhTempo: true,
                    tanggalBayar: true,
                  },
                },
                pembayaran: {
                  where: { isBatalkan: false },
                  select: {
                    tanggalBayar: true,
                    totalBayar: true,
                    catatan: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.nasabah.count({ where }),
  ])

  const withIndicators = data.map((nasabah) => {
    let totalTagihanArrears = 0
    let totalDibayarArrears = 0
    let telat = 0
    let belumJatuhTempo = 0
    let belumBayar = 0
    let outstanding = 0
    let lastPaymentAt: Date | null = null
    let nextDueAt: Date | null = null
    let overdueCount = 0
    let overdueOldestDueAt: Date | null = null
    let overdueOldestDaysLate = 0
    let overdueMaxDaysLate = 0
    let aktifPinjaman = 0

    const pinjamanList = nasabah.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    for (const pinjaman of pinjamanList) {
      outstanding += Number(pinjaman.sisaPinjaman)
      if (pinjaman.status !== "LUNAS") aktifPinjaman += 1

      const pembayaranTagMap = new Map<string, number>()
      for (const p of pinjaman.pembayaran) {
        if (p.tanggalBayar) {
          if (!lastPaymentAt || p.tanggalBayar > lastPaymentAt) lastPaymentAt = p.tanggalBayar
        }
        const tags = parseJadwalTags(p.catatan)
        if (tags.length === 0) continue
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

        // Hanya hitung tagihan yang SUDAH JATUH TEMPO (atau sudah dibayar) ke tunggakan
        if (jadwal.sudahDibayar || jadwal.tanggalJatuhTempo <= now || bayarEfektif > 0) {
          totalTagihanArrears += nominalTagihan
          totalDibayarArrears += bayarEfektif
        }

        if (jadwal.sudahDibayar || bayarEfektif >= nominalTagihan) {
          if (jadwal.tanggalBayar && jadwal.tanggalBayar > jadwal.tanggalJatuhTempo) telat += 1
          continue
        }

        if (!nextDueAt || jadwal.tanggalJatuhTempo < nextDueAt) nextDueAt = jadwal.tanggalJatuhTempo

        if (jadwal.tanggalJatuhTempo > now) {
          belumJatuhTempo += 1
        } else {
          belumBayar += 1
          telat += 1
          overdueCount += 1
          if (!overdueOldestDueAt || jadwal.tanggalJatuhTempo < overdueOldestDueAt) {
            overdueOldestDueAt = jadwal.tanggalJatuhTempo
          }
          const daysLate = Math.max(
            0,
            Math.floor((now.getTime() - jadwal.tanggalJatuhTempo.getTime()) / (1000 * 60 * 60 * 24)),
          )
          if (daysLate > overdueMaxDaysLate) overdueMaxDaysLate = daysLate
        }
      }
    }

    if (overdueOldestDueAt) {
      overdueOldestDaysLate = Math.max(
        0,
        Math.floor((now.getTime() - overdueOldestDueAt.getTime()) / (1000 * 60 * 60 * 24)),
      )
    }

    const tunggakanNominal = Math.max(0, totalTagihanArrears - totalDibayarArrears)
    const ranking = computeRanking({ telat, tunggakanNominal }, rankingConfig)

    return {
      ...nasabah,
      indikator: {
        ranking,
        telat,
        belumBayar,
        belumJatuhTempo,
        kurangAngsuran: tunggakanNominal, // Mapping for UI compatibility if needed, but semantic is tunggakan
        tunggakanNominal,
        outstanding,
        lastPaymentAt,
        nextDueAt,
        overdueCount,
        overdueOldestDueAt,
        overdueOldestDaysLate,
        overdueMaxDaysLate,
        aktifPinjaman,
      },
    }
  })

  return serializeData({ data: withIndicators, total, page, totalPages: Math.ceil(total / limit) })
}

export async function getNasabahById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const result = await prisma.nasabah.findUnique({
    where: { id },
    include: {
      kelompok: true,
      kolektor: { select: { id: true, name: true, email: true } },
      pengajuan: {
        orderBy: { tanggalPengajuan: "desc" },
        include: {
          pinjaman: {
            include: {
              jadwalAngsuran: {
                orderBy: { tanggalJatuhTempo: "asc" },
              },
              pembayaran: {
                where: { isBatalkan: false },
                orderBy: { tanggalBayar: "desc" },
                include: { inputOleh: { select: { name: true } } },
              },
            },
          },
        },
      },
      penjamin: true,
    },
  })

  return serializeData(result)
}

export async function createNasabah(input: NasabahInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = nasabahSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { tanggalLahir, kelompokId, kolektorId, dokumenUrls, ...rest } = parsed.data
  const nomorAnggota = await generateNomorAnggota()

  const nasabah = await prisma.nasabah.create({
    data: {
      ...rest,
      nomorAnggota,
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
      kelompokId: kelompokId || null,
      kolektorId: kolektorId || null,
      dokumenUrls: dokumenUrls ?? [],
      tanggalGabung: new Date(),
    },
  })

  revalidatePath("/nasabah")
  return { success: true, data: nasabah }
}

export async function updateNasabah(id: string, input: Partial<NasabahInput>) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const { tanggalLahir, dokumenUrls, ...rest } = input
  const normalized = { ...rest } as Record<string, unknown>
  if ("kelompokId" in normalized && !normalized.kelompokId) normalized.kelompokId = null
  if ("kolektorId" in normalized && !normalized.kolektorId) normalized.kolektorId = null

  await prisma.nasabah.update({
    where: { id },
    data: {
      ...normalized,
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
      ...(dokumenUrls ? { dokumenUrls } : {}),
    },
  })

  revalidatePath("/nasabah")
  revalidatePath(`/nasabah/${id}`)
  return { success: true }
}

export async function ubahStatusNasabah(id: string, status: "AKTIF" | "NON_AKTIF" | "KELUAR") {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await prisma.nasabah.update({ where: { id }, data: { status } })
  revalidatePath("/nasabah")
  return { success: true }
}

export async function getKelompokList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return prisma.kelompok.findMany({ orderBy: { nama: "asc" } })
}

export async function getKolektorList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return prisma.user.findMany({
    where: { roles: { some: { role: "KOLEKTOR" } }, isActive: true },
    select: { id: true, name: true },
  })
}
