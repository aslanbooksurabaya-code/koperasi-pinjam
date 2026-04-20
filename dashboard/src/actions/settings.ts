"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { RoleType } from "@prisma/client"
import { DEFAULT_RANKING_CONFIG, type RankingConfig } from "@/lib/ranking"
import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@/lib/datetime"

const RANKING_KEY = "RANKING_CONFIG"
const COMPANY_KEY = "COMPANY_INFO"

const rankingConfigSchema = z.object({
  bMaxTelat: z.coerce.number().int().min(0).max(365),
  bMaxTunggakan: z.coerce.number().min(0).max(1_000_000_000_000).optional(),
  cMaxTelat: z.coerce.number().int().min(0).max(365),
  cMaxTunggakan: z.coerce.number().min(0).max(1_000_000_000_000).optional(),
  // For backward compatibility
  bMaxKurang: z.coerce.number().min(0).max(1_000_000_000_000).optional(),
  cMaxKurang: z.coerce.number().min(0).max(1_000_000_000_000).optional(),
})

export type CompanyInfo = {
  name: string
  tagline?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logoDataUrl?: string
  timeZone?: string
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Koperasi Simpan Pinjam",
  tagline: "Sistem Informasi Manajemen Koperasi",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoDataUrl: "",
  timeZone: DEFAULT_TIME_ZONE,
}

const companyInfoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  website: z.string().trim().max(200).optional(),
  logoDataUrl: z
    .string()
    .trim()
    .max(3_000_000)
    .optional(),
  timeZone: z.string().trim().max(64).optional(),
})

export async function getRankingConfig(): Promise<RankingConfig> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const row = await prisma.appSetting.findUnique({ where: { key: RANKING_KEY } })
  if (!row) return DEFAULT_RANKING_CONFIG

  const parsed = rankingConfigSchema.safeParse(row.value)
  if (!parsed.success) return DEFAULT_RANKING_CONFIG

  const legacy = parsed.data as { bMaxKurang?: unknown; cMaxKurang?: unknown }
  const legacyBMaxKurang =
    typeof legacy.bMaxKurang === "number" ? legacy.bMaxKurang : undefined
  const legacyCMaxKurang =
    typeof legacy.cMaxKurang === "number" ? legacy.cMaxKurang : undefined

  return {
    ...DEFAULT_RANKING_CONFIG,
    ...parsed.data,
    // Map old keys to new if they exist in the DB
    bMaxTunggakan:
      parsed.data.bMaxTunggakan ??
      legacyBMaxKurang ??
      DEFAULT_RANKING_CONFIG.bMaxTunggakan,
    cMaxTunggakan:
      parsed.data.cMaxTunggakan ??
      legacyCMaxKurang ??
      DEFAULT_RANKING_CONFIG.cMaxTunggakan,
  }
}

export async function updateRankingConfig(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.PIMPINAN])
  } catch {
    return { error: "Hanya admin/pimpinan yang dapat mengubah pengaturan ranking." }
  }

  const parsed = rankingConfigSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const legacy = parsed.data as { bMaxKurang?: unknown; cMaxKurang?: unknown }
  const legacyBMaxKurang =
    typeof legacy.bMaxKurang === "number" ? legacy.bMaxKurang : undefined
  const legacyCMaxKurang =
    typeof legacy.cMaxKurang === "number" ? legacy.cMaxKurang : undefined

  // Clean data to only save the new keys if we want to migrate
  const dataToSave = {
    bMaxTelat: parsed.data.bMaxTelat,
    bMaxTunggakan: parsed.data.bMaxTunggakan ?? legacyBMaxKurang,
    cMaxTelat: parsed.data.cMaxTelat,
    cMaxTunggakan: parsed.data.cMaxTunggakan ?? legacyCMaxKurang,
  }

  await prisma.appSetting.upsert({
    where: { key: RANKING_KEY },
    create: { key: RANKING_KEY, value: dataToSave },
    update: { value: dataToSave },
  })

  revalidatePath("/settings")
  revalidatePath("/laporan/transaksi-per-user")
  return { success: true }
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const row = await prisma.appSetting.findUnique({ where: { key: COMPANY_KEY } })
  if (!row) return DEFAULT_COMPANY_INFO

  const parsed = companyInfoSchema.safeParse(row.value)
  if (!parsed.success) return DEFAULT_COMPANY_INFO

  return {
    ...DEFAULT_COMPANY_INFO,
    ...parsed.data,
    timeZone: normalizeTimeZone(parsed.data.timeZone),
  }
}

export async function updateCompanyInfo(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.PIMPINAN])
  } catch {
    return { error: "Hanya admin/pimpinan yang dapat mengubah informasi perusahaan." }
  }

  const parsed = companyInfoSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.appSetting.upsert({
    where: { key: COMPANY_KEY },
    create: { key: COMPANY_KEY, value: parsed.data },
    update: { value: parsed.data },
  })

  revalidatePath("/settings")
  revalidatePath("/")
  revalidatePath("/dokumen")
  return { success: true }
}
