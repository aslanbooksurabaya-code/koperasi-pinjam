"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function defaultPasswordFromPhone(noHp?: string | null) {
  const digits = (noHp ?? "").replace(/\D/g, "")
  if (digits.length >= 6) return `Kolektor${digits.slice(-6)}`
  return "Kolektor123"
}

export async function getDaftarKolektor() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      roles: { some: { role: "KOLEKTOR" } },
    },
    include: {
      roles: { select: { role: true } },
      _count: {
        select: {
          nasabahSebagaiKolektor: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.roles.map((r) => r.role),
    totalNasabah: u._count.nasabahSebagaiKolektor,
  }))
}

export async function getSumberKolektorOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [nasabah, kelompok] = await Promise.all([
    prisma.nasabah.findMany({
      where: { status: "AKTIF" },
      select: { id: true, namaLengkap: true, noHp: true },
      orderBy: { namaLengkap: "asc" },
    }),
    prisma.kelompok.findMany({
      select: { id: true, kode: true, nama: true, ketua: true },
      orderBy: { nama: "asc" },
    }),
  ])

  return { nasabah, kelompok }
}

async function createOrUpdateKolektorUser(params: {
  name: string
  email: string
  password: string
  isAdmin?: boolean
}) {
  const email = normalizeEmail(params.email)
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  })

  if (!existing) {
    const hash = await bcrypt.hash(params.password, 10)
    return prisma.user.create({
      data: {
        name: params.name,
        email,
        password: hash,
        isActive: true,
        roles: {
          create: [
            { role: RoleType.KOLEKTOR },
            ...(params.isAdmin ? [{ role: RoleType.ADMIN }] : []),
          ],
        },
      },
    })
  }

  const existingRoles = new Set(existing.roles.map((r) => r.role))
  const createRoles: { role: RoleType }[] = []
  if (!existingRoles.has(RoleType.KOLEKTOR)) createRoles.push({ role: RoleType.KOLEKTOR })
  if (params.isAdmin && !existingRoles.has(RoleType.ADMIN)) createRoles.push({ role: RoleType.ADMIN })

  if (createRoles.length > 0) {
    await prisma.userRole.createMany({
      data: createRoles.map((r) => ({ userId: existing.id, role: r.role })),
      skipDuplicates: true,
    })
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: { name: params.name || existing.name },
  })
}

export async function createKolektorManual(input: {
  name: string
  email: string
  password: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  if (!input.name?.trim() || !input.email?.trim() || !input.password?.trim()) {
    return { error: "Nama, email, dan password wajib diisi." }
  }

  await createOrUpdateKolektorUser({
    name: input.name.trim(),
    email: input.email,
    password: input.password,
    isAdmin: input.isAdmin,
  })

  revalidatePath("/kolektor")
  return { success: true }
}

export async function createKolektorFromNasabah(input: {
  nasabahId: string
  email?: string
  password?: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const nasabah = await prisma.nasabah.findUnique({
    where: { id: input.nasabahId },
    select: { id: true, namaLengkap: true, noHp: true },
  })

  if (!nasabah) return { error: "Nasabah tidak ditemukan." }

  const safeName = nasabah.namaLengkap.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  const generatedEmail = input.email?.trim() || `${safeName || "kolektor"}.${nasabah.id.slice(-4)}@koperasi.local`

  const user = await createOrUpdateKolektorUser({
    name: nasabah.namaLengkap,
    email: generatedEmail,
    password: input.password?.trim() || defaultPasswordFromPhone(nasabah.noHp),
    isAdmin: input.isAdmin,
  })

  await prisma.nasabah.update({
    where: { id: nasabah.id },
    data: { kolektorId: user.id },
  })

  revalidatePath("/kolektor")
  revalidatePath("/nasabah")
  return { success: true, defaultEmail: generatedEmail }
}

export async function createKolektorFromKetuaKelompok(input: {
  kelompokId: string
  email?: string
  password?: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const kelompok = await prisma.kelompok.findUnique({
    where: { id: input.kelompokId },
    include: {
      nasabah: {
        select: { id: true, namaLengkap: true, noHp: true },
      },
    },
  })

  if (!kelompok) return { error: "Kelompok tidak ditemukan." }

  const ketuaNasabah = kelompok.nasabah.find((n) => n.namaLengkap === kelompok.ketua) ?? kelompok.nasabah[0]
  if (!ketuaNasabah) return { error: "Kelompok belum memiliki anggota untuk dijadikan kolektor." }

  const safeName = ketuaNasabah.namaLengkap.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  const generatedEmail = input.email?.trim() || `${safeName || "ketua"}.${kelompok.kode.toLowerCase()}@koperasi.local`

  const user = await createOrUpdateKolektorUser({
    name: ketuaNasabah.namaLengkap,
    email: generatedEmail,
    password: input.password?.trim() || defaultPasswordFromPhone(ketuaNasabah.noHp),
    isAdmin: input.isAdmin,
  })

  await prisma.nasabah.updateMany({
    where: { kelompokId: kelompok.id },
    data: { kolektorId: user.id },
  })

  revalidatePath("/kolektor")
  revalidatePath("/nasabah")
  return { success: true, defaultEmail: generatedEmail }
}

export async function getUserRoleTable() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      roles: { select: { role: true } },
    },
    orderBy: { name: "asc" },
  })

  return users.map((u) => ({
    ...u,
    roles: u.roles.map((r) => r.role),
  }))
}
