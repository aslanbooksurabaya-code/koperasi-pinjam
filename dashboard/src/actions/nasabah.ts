"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nasabahSchema, type NasabahInput } from "@/lib/validations/nasabah"

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
      },
    }),
    prisma.nasabah.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getNasabahById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return prisma.nasabah.findUnique({
    where: { id },
    include: {
      kelompok: true,
      kolektor: { select: { id: true, name: true, email: true } },
      pengajuan: {
        orderBy: { tanggalPengajuan: "desc" },
        take: 5,
        include: { pinjaman: { select: { nomorKontrak: true, status: true, sisaPinjaman: true } } },
      },
      penjamin: true,
    },
  })
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
