"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { differenceInDays } from "date-fns"

export async function getDashboardStats() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()

  const [totalNasabah, pinjamanAktif, totalOutstanding, jadwalTelat] = await Promise.all([
    prisma.nasabah.count({ where: { status: "AKTIF" } }),
    prisma.pinjaman.count({ where: { status: "AKTIF" } }),
    prisma.pinjaman.aggregate({
      where: { status: { in: ["AKTIF", "MENUNGGAK"] } },
      _sum: { sisaPinjaman: true },
    }),
    prisma.jadwalAngsuran.findMany({
      where: { sudahDibayar: false, tanggalJatuhTempo: { lt: today } },
      include: {
        pinjaman: {
          include: {
            pengajuan: {
              include: {
                kelompok: { select: { nama: true, wilayah: true } },
                nasabah: { select: { namaLengkap: true } },
              },
            },
          },
        },
      },
    }),
  ])

  // Hitung total tunggakan
  const totalTunggakan = jadwalTelat.reduce((sum, j) => sum + Number(j.total), 0)

  // Penagihan hari ini (jatuh tempo hari ini)
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endToday = new Date(startToday.getTime() + 86400000)
  const penagihanHariIni = await prisma.jadwalAngsuran.count({
    where: { sudahDibayar: false, tanggalJatuhTempo: { gte: startToday, lt: endToday } },
  })

  // Arus kas 6 bulan
  const arusKas6Bulan = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const bulanData = await prisma.kasTransaksi.groupBy({
      by: ["jenis"],
      where: { tanggal: { gte: d, lte: endD } },
      _sum: { jumlah: true },
    })

    const masuk = bulanData.find((b) => b.jenis === "MASUK")?._sum.jumlah
    const keluar = bulanData.find((b) => b.jenis === "KELUAR")?._sum.jumlah

    arusKas6Bulan.push({
      bulan: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      masuk: Number(masuk ?? 0),
      keluar: Number(keluar ?? 0),
    })
  }

  // Top 5 tunggakan per kelompok
  const tunggakanPerKelompok: Record<string, { nama: string; wilayah: string; total: number; count: number }> = {}
  for (const j of jadwalTelat) {
    const k = j.pinjaman.pengajuan.kelompok
    if (!k) continue
    if (!tunggakanPerKelompok[k.nama]) {
      tunggakanPerKelompok[k.nama] = { nama: k.nama, wilayah: k.wilayah ?? "", total: 0, count: 0 }
    }
    tunggakanPerKelompok[k.nama].total += Number(j.total)
    tunggakanPerKelompok[k.nama].count += 1
  }
  const topTunggakan = Object.values(tunggakanPerKelompok)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    totalNasabah,
    pinjamanAktif,
    totalOutstanding: Number(totalOutstanding._sum.sisaPinjaman ?? 0),
    totalTunggakan,
    penagihanHariIni,
    arusKas6Bulan,
    topTunggakan,
  }
}

export async function getTunggakanList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const jadwals = await prisma.jadwalAngsuran.findMany({
    where: { sudahDibayar: false, tanggalJatuhTempo: { lt: today } },
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
    orderBy: { tanggalJatuhTempo: "asc" },
  })

  return jadwals.map((j) => ({
    ...j,
    hariTelat: differenceInDays(today, j.tanggalJatuhTempo),
  }))
}

type KelompokOverview = {
  id: string
  kode: string
  nama: string
  wilayah: string
  kolektor: string
  anggota: number
  pinjamanAktif: number
  outstanding: number
  tunggakan: number
}

export async function getKelompokOverview(search?: string): Promise<{
  data: KelompokOverview[]
  summary: {
    totalKelompok: number
    totalAnggota: number
    totalPinjamanAktif: number
    avgAnggotaPerKelompok: number
  }
}> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()

  const kelompok = await prisma.kelompok.findMany({
    where: search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { kode: { contains: search, mode: "insensitive" } },
            { wilayah: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      nasabah: {
        select: {
          id: true,
          kolektor: { select: { name: true } },
        },
      },
      pengajuan: {
        select: {
          pinjaman: {
            select: {
              id: true,
              status: true,
              sisaPinjaman: true,
              jadwalAngsuran: {
                where: {
                  sudahDibayar: false,
                  tanggalJatuhTempo: { lt: today },
                },
                select: { total: true },
              },
            },
          },
        },
      },
    },
    orderBy: { nama: "asc" },
  })

  const data = kelompok.map((k) => {
    const kolektorCounter: Record<string, number> = {}
    for (const n of k.nasabah) {
      const nama = n.kolektor?.name
      if (!nama) continue
      kolektorCounter[nama] = (kolektorCounter[nama] ?? 0) + 1
    }
    const kolektor =
      Object.entries(kolektorCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Belum ditetapkan"

    const pinjaman = k.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    const pinjamanAktif = pinjaman.filter((p) => p.status === "AKTIF" || p.status === "MENUNGGAK").length
    const outstanding = pinjaman.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0)
    const tunggakan = pinjaman.reduce(
      (sum, p) => sum + p.jadwalAngsuran.reduce((inner, j) => inner + Number(j.total), 0),
      0
    )

    return {
      id: k.id,
      kode: k.kode,
      nama: k.nama,
      wilayah: k.wilayah ?? "-",
      kolektor,
      anggota: k.nasabah.length,
      pinjamanAktif,
      outstanding,
      tunggakan,
    }
  })

  const totalKelompok = data.length
  const totalAnggota = data.reduce((sum, item) => sum + item.anggota, 0)
  const totalPinjamanAktif = data.reduce((sum, item) => sum + item.pinjamanAktif, 0)
  const avgAnggotaPerKelompok = totalKelompok > 0 ? Math.round(totalAnggota / totalKelompok) : 0

  return {
    data,
    summary: { totalKelompok, totalAnggota, totalPinjamanAktif, avgAnggotaPerKelompok },
  }
}

type KolektorOverview = {
  id: string
  nama: string
  nasabah: number
  kelompok: number
  target: number
  realisasi: number
  tunggakan: number
}

export async function getKolektorOverview(): Promise<KolektorOverview[]> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const kolektorList = await prisma.user.findMany({
    where: {
      isActive: true,
      roles: { some: { role: "KOLEKTOR" } },
    },
    select: {
      id: true,
      name: true,
      nasabahSebagaiKolektor: {
        select: {
          kelompokId: true,
          pengajuan: {
            select: {
              pinjaman: {
                select: {
                  pembayaran: {
                    where: {
                      isBatalkan: false,
                      tanggalBayar: {
                        gte: startMonth,
                        lt: endMonth,
                      },
                    },
                    select: { totalBayar: true },
                  },
                  jadwalAngsuran: {
                    where: {
                      sudahDibayar: false,
                      tanggalJatuhTempo: { lt: now },
                    },
                    select: { total: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return kolektorList.map((k) => {
    const kelompokSet = new Set(k.nasabahSebagaiKolektor.map((n) => n.kelompokId).filter(Boolean))
    let realisasi = 0
    let tunggakan = 0
    let target = 0

    for (const nasabah of k.nasabahSebagaiKolektor) {
      for (const pengajuan of nasabah.pengajuan) {
        const pinjaman = pengajuan.pinjaman
        if (!pinjaman) continue
        for (const bayar of pinjaman.pembayaran) {
          realisasi += Number(bayar.totalBayar)
        }
        for (const jadwal of pinjaman.jadwalAngsuran) {
          tunggakan += Number(jadwal.total)
          target += Number(jadwal.total)
        }
      }
    }

    return {
      id: k.id,
      nama: k.name,
      nasabah: k.nasabahSebagaiKolektor.length,
      kelompok: kelompokSet.size,
      target,
      realisasi,
      tunggakan,
    }
  })
}
