"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { RoleType } from "@prisma/client"
import { DEFAULT_RANKING_CONFIG, type RankingConfig } from "@/lib/ranking"

const RANKING_KEY = "RANKING_CONFIG"

const rankingConfigSchema = z.object({
  bMaxTelat: z.coerce.number().int().min(0).max(365),
  bMaxKurang: z.coerce.number().min(0).max(1_000_000_000_000),
  cMaxTelat: z.coerce.number().int().min(0).max(365),
  cMaxKurang: z.coerce.number().min(0).max(1_000_000_000_000),
})

export async function getRankingConfig(): Promise<RankingConfig> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const row = await prisma.appSetting.findUnique({ where: { key: RANKING_KEY } })
  if (!row) return DEFAULT_RANKING_CONFIG

  const parsed = rankingConfigSchema.safeParse(row.value)
  if (!parsed.success) return DEFAULT_RANKING_CONFIG

  return {
    ...DEFAULT_RANKING_CONFIG,
    ...parsed.data,
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

  await prisma.appSetting.upsert({
    where: { key: RANKING_KEY },
    create: { key: RANKING_KEY, value: parsed.data },
    update: { value: parsed.data },
  })

  revalidatePath("/settings")
  revalidatePath("/laporan/transaksi-per-user")
  return { success: true }
}

