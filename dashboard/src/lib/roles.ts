import { RoleType } from "@prisma/client"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
  }
} | null

export function extractRoles(session: SessionLike): RoleType[] {
  const roles = session?.user?.roles ?? []
  return roles.filter((role): role is RoleType =>
    Object.values(RoleType).includes(role as RoleType)
  )
}

export function requireRoles(session: SessionLike, allowedRoles: RoleType[]) {
  const userId = session?.user?.id
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const roles = extractRoles(session)
  const allowed = roles.some((role) => allowedRoles.includes(role))

  if (!allowed) {
    throw new Error("Forbidden")
  }

  return { userId, roles }
}

export function hasAnyRole(session: SessionLike, allowedRoles: RoleType[]) {
  const roles = extractRoles(session)
  return roles.some((role) => allowedRoles.includes(role))
}
