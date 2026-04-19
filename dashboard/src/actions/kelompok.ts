"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { kelompokSchema, type KelompokInput } from "@/lib/validations/kelompok"

export async function getKelompokList(params?: { search?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.kelompok.findMany({
    where: params?.search
      ? {
          OR: [
            { kode: { contains: params.search, mode: "insensitive" } },
            { nama: { contains: params.search, mode: "insensitive" } },
            { wilayah: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nama: "asc" },
  })
}

export async function getKelompokById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.kelompok.findUnique({
    where: { id },
  })
}

export async function createKelompok(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = kelompokSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kelompok.findUnique({
    where: { kode: parsed.data.kode },
    select: { id: true },
  })
  if (existing) return { error: { kode: ["Kode kelompok sudah digunakan."] } }

  const kelompok = await prisma.kelompok.create({
    data: parsed.data,
  })

  revalidatePath("/kelompok")
  return { success: true, data: kelompok }
}

export async function updateKelompok(id: string, input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = kelompokSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kelompok.findFirst({
    where: { kode: parsed.data.kode, id: { not: id } },
    select: { id: true },
  })
  if (existing) return { error: { kode: ["Kode kelompok sudah digunakan."] } }

  await prisma.kelompok.update({
    where: { id },
    data: parsed.data,
  })

  revalidatePath("/kelompok")
  return { success: true }
}
