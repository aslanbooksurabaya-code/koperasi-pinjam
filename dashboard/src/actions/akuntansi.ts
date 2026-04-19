"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { AccountType, Prisma, RoleType, RekonsiliasiStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "@/lib/audit"

const DEFAULT_ACCOUNTS: Array<{ code: string; name: string; type: AccountType }> = [
  { code: "CASH_TUNAI", name: "Kas Tunai", type: "ASSET" },
  { code: "CASH_BANK", name: "Kas Bank", type: "ASSET" },
  { code: "PIUTANG_PINJAMAN", name: "Piutang Pinjaman", type: "ASSET" },
  { code: "PENERIMAAN_ANGSURAN", name: "Penerimaan Angsuran", type: "REVENUE" },
  { code: "PENDAPATAN_DENDA", name: "Pendapatan Denda", type: "REVENUE" },
  { code: "PENDAPATAN_ADMIN", name: "Pendapatan Administrasi", type: "REVENUE" },
  { code: "BEBAN_OPERASIONAL", name: "Beban Operasional", type: "EXPENSE" },
  { code: "BEBAN_GAJI", name: "Beban Gaji", type: "EXPENSE" },
  { code: "PENYESUAIAN", name: "Penyesuaian", type: "EXPENSE" },
]

async function ensureDefaultAccounts() {
  const count = await prisma.account.count()
  if (count > 0) return

  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS.map((a) => ({
      code: a.code,
      name: a.name,
      type: a.type,
      isActive: true,
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  })
}

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

function requireFinanceRoles(session: SessionLike) {
  return requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])
}

export async function getAccountList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  await ensureDefaultAccounts()

  return prisma.account.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  })
}

const accountCreateSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(60)
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, "_")),
  name: z.string().min(3).max(120).transform((v) => v.trim()),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
})

export async function createAccount(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])

  const parsed = accountCreateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.account.findUnique({ where: { code: parsed.data.code } })
  if (existing) return { error: `Kode akun "${existing.code}" sudah ada.` }

  const row = await prisma.account.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      type: parsed.data.type,
      isActive: true,
    },
  })

  revalidatePath("/akuntansi/akun")
  await writeAuditLog({
    actorId: userId,
    entityType: "ACCOUNT",
    entityId: row.id,
    action: "CREATE",
    afterData: { code: row.code, name: row.name, type: row.type },
  })

  return { success: true, data: row }
}

export async function getKasKategoriMappingList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  await ensureDefaultAccounts()

  const [accounts, kategori] = await Promise.all([
    prisma.account.findMany({ where: { isActive: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.kasKategori.findMany({
      where: { isActive: true },
      include: { account: true },
      orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    }),
  ])

  return { accounts, kategori }
}

const mappingSchema = z.object({
  kategoriId: z.string().min(3),
  accountId: z.string().min(3).nullable(),
})

export async function updateKasKategoriMapping(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])

  const parsed = mappingSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kasKategori.findUnique({ where: { id: parsed.data.kategoriId } })
  if (!existing) return { error: "Kategori kas tidak ditemukan." }

  if (parsed.data.accountId) {
    const acc = await prisma.account.findUnique({ where: { id: parsed.data.accountId } })
    if (!acc) return { error: "Akun tidak ditemukan." }
  }

  const updated = await prisma.kasKategori.update({
    where: { id: parsed.data.kategoriId },
    data: {
      accountId: parsed.data.accountId,
    },
    include: { account: true },
  })

  revalidatePath("/akuntansi/mapping-kategori")
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_KATEGORI",
    entityId: updated.id,
    action: "UPDATE",
    afterData: { key: updated.key, accountId: updated.accountId },
  })

  return { success: true, data: updated }
}

function monthRange(params?: { month?: string; year?: string }) {
  const now = new Date()
  const month = Number(params?.month ?? now.getMonth() + 1)
  const year = Number(params?.year ?? now.getFullYear())
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)
  return { month, year, startDate, endDate }
}

async function getCashSaldoBookByJenis(kasJenis: "TUNAI" | "BANK", endExclusive: Date) {
  const rows = await prisma.kasTransaksi.findMany({
    where: { tanggal: { lt: endExclusive }, kasJenis },
    select: { jenis: true, jumlah: true },
  })
  return rows.reduce((acc, r) => {
    const amt = Number(r.jumlah)
    return acc + (r.jenis === "MASUK" ? amt : -amt)
  }, 0)
}

const rekonsiliasiCreateSchema = z.object({
  accountId: z.string().min(3),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  saldoStatement: z.coerce.number(),
  catatan: z.string().optional(),
  buktiUrl: z.string().min(3).optional(),
})

export async function getRekonsiliasiKasList(params?: { year?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  const year = params?.year ? Number(params.year) : undefined

  const rows = await prisma.rekonsiliasiKas.findMany({
    where: year ? { periodYear: year } : undefined,
    include: { account: true, createdBy: { select: { id: true, name: true } } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
  })

  const cashAccounts = await prisma.account.findMany({
    where: { code: { in: ["CASH_TUNAI", "CASH_BANK"] }, isActive: true },
    orderBy: { code: "asc" },
  })

  return { rows, cashAccounts }
}

export async function createRekonsiliasiKas(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireFinanceRoles(session as unknown as SessionLike)

  const parsed = rekonsiliasiCreateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const account = await prisma.account.findUnique({ where: { id: parsed.data.accountId } })
  if (!account) return { error: "Akun tidak ditemukan." }
  if (account.code !== "CASH_TUNAI" && account.code !== "CASH_BANK") {
    return { error: "Rekonsiliasi saat ini hanya untuk akun kas tunai dan kas bank." }
  }

  const endExclusive = new Date(parsed.data.year, parsed.data.month, 1)
  const kasJenis = account.code === "CASH_BANK" ? "BANK" : "TUNAI"
  const saldoBook = await getCashSaldoBookByJenis(kasJenis, endExclusive)
  const selisih = parsed.data.saldoStatement - saldoBook

  const row = await prisma.rekonsiliasiKas.upsert({
    where: {
      accountId_periodMonth_periodYear: {
        accountId: account.id,
        periodMonth: parsed.data.month,
        periodYear: parsed.data.year,
      },
    },
    create: {
      accountId: account.id,
      periodMonth: parsed.data.month,
      periodYear: parsed.data.year,
      saldoStatement: new Prisma.Decimal(parsed.data.saldoStatement),
      saldoBook: new Prisma.Decimal(saldoBook),
      selisih: new Prisma.Decimal(selisih),
      catatan: parsed.data.catatan?.trim() || null,
      buktiUrl: parsed.data.buktiUrl?.trim() || null,
      status: RekonsiliasiStatus.DRAFT,
      createdById: userId,
    },
    update: {
      saldoStatement: new Prisma.Decimal(parsed.data.saldoStatement),
      saldoBook: new Prisma.Decimal(saldoBook),
      selisih: new Prisma.Decimal(selisih),
      catatan: parsed.data.catatan?.trim() || null,
      buktiUrl: parsed.data.buktiUrl?.trim() || null,
      updatedAt: new Date(),
    },
    include: { account: true },
  })

  revalidatePath("/laporan/rekonsiliasi")
  await writeAuditLog({
    actorId: userId,
    entityType: "REKONSILIASI_KAS",
    entityId: row.id,
    action: "CREATE",
    afterData: {
      accountCode: row.account.code,
      periodMonth: row.periodMonth,
      periodYear: row.periodYear,
      saldoStatement: row.saldoStatement.toString(),
      saldoBook: row.saldoBook.toString(),
      selisih: row.selisih.toString(),
    },
  })

  return { success: true, data: row }
}

export async function setRekonsiliasiStatus(input: { id: string; status: "DRAFT" | "SELESAI" }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireFinanceRoles(session as unknown as SessionLike)

  const row = await prisma.rekonsiliasiKas.findUnique({ where: { id: input.id }, include: { account: true } })
  if (!row) return { error: "Data rekonsiliasi tidak ditemukan." }

  const updated = await prisma.rekonsiliasiKas.update({
    where: { id: row.id },
    data: { status: input.status },
  })

  revalidatePath("/laporan/rekonsiliasi")
  await writeAuditLog({
    actorId: userId,
    entityType: "REKONSILIASI_KAS",
    entityId: row.id,
    action: "UPDATE",
    afterData: { status: updated.status, accountCode: row.account.code },
  })
  return { success: true }
}

export async function getLedgerKasReport(params?: { kasJenis?: string; month?: string; year?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  const kasJenis = params?.kasJenis === "BANK" ? "BANK" : "TUNAI"
  const { month, year, startDate, endDate } = monthRange({ month: params?.month, year: params?.year })

  const rows = await prisma.kasTransaksi.findMany({
    where: { kasJenis, tanggal: { gte: startDate, lt: endDate }, isApproved: true },
    orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    include: { inputOleh: { select: { name: true } } },
  })

  let saldo = await getCashSaldoBookByJenis(kasJenis, startDate)
  const data = rows.map((r) => {
    const amt = Number(r.jumlah)
    const debit = r.jenis === "MASUK" ? amt : 0
    const kredit = r.jenis === "KELUAR" ? amt : 0
    saldo += r.jenis === "MASUK" ? amt : -amt
    return {
      id: r.id,
      tanggal: r.tanggal,
      kategori: r.kategori,
      deskripsi: r.deskripsi,
      buktiUrl: r.buktiUrl,
      debit,
      kredit,
      saldo,
      inputOleh: r.inputOleh.name,
    }
  })

  return { kasJenis, month, year, openingBalance: saldo - data.reduce((a, b) => a + (b.debit - b.kredit), 0), data, closingBalance: saldo }
}

export async function getNeracaSederhana(params?: { month?: string; year?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  const { month, year, endDate } = monthRange(params)

  const [saldoTunai, saldoBank, outstanding, simpanan] = await Promise.all([
    getCashSaldoBookByJenis("TUNAI", endDate),
    getCashSaldoBookByJenis("BANK", endDate),
    prisma.pinjaman.aggregate({
      where: { status: { in: ["AKTIF", "MENUNGGAK", "MACET"] } },
      _sum: { sisaPinjaman: true },
    }),
    prisma.simpanan.aggregate({
      _sum: { jumlah: true },
    }),
  ])

  const piutang = Number(outstanding._sum.sisaPinjaman ?? 0)
  const totalKas = saldoTunai + saldoBank
  const totalAset = totalKas + piutang
  const totalSimpanan = Number(simpanan._sum.jumlah ?? 0)
  const ekuitas = totalAset - totalSimpanan

  return {
    month,
    year,
    aset: [
      { label: "Kas Tunai", nilai: saldoTunai },
      { label: "Kas Bank", nilai: saldoBank },
      { label: "Piutang Pinjaman (Outstanding)", nilai: piutang },
    ],
    kewajiban: [
      { label: "Simpanan Anggota (Akumulasi)", nilai: totalSimpanan },
    ],
    ekuitas: [
      { label: "Ekuitas (Selisih)", nilai: ekuitas },
    ],
    totals: {
      totalKas,
      totalAset,
      totalKewajiban: totalSimpanan,
      totalEkuitas: ekuitas,
    },
  }
}
