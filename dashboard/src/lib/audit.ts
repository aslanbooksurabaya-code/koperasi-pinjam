import { AuditAction, ApprovalEntityType, ApprovalStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type JsonPayload = Prisma.InputJsonValue | undefined

export async function writeAuditLog(input: {
  actorId?: string
  entityType: string
  entityId?: string
  action: AuditAction
  beforeData?: JsonPayload
  afterData?: JsonPayload
  metadata?: JsonPayload
  ipAddress?: string
}) {
  try {
    let finalActorId = input.actorId
    if (finalActorId) {
      const user = await prisma.user.findUnique({ where: { id: finalActorId }, select: { id: true } })
      if (!user) finalActorId = undefined
    }

    await prisma.auditLog.create({
      data: {
        actorId: finalActorId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        beforeData: input.beforeData,
        afterData: input.afterData,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
      },
    })
  } catch (error) {
    // Non-blocking while migration rollout is in progress.
    console.warn("Audit log write skipped:", error)
  }
}

export async function writeApprovalLog(input: {
  entityType: ApprovalEntityType
  entityId: string
  status?: ApprovalStatus
  catatan?: string
  requestedById: string
  approvedById?: string
}) {
  try {
    // Basic existence checks to avoid foreign key violations
    const requester = await prisma.user.findUnique({ where: { id: input.requestedById }, select: { id: true } })
    if (!requester) return // Cannot log without valid requester

    let finalApprovedById = input.approvedById
    if (finalApprovedById) {
      const approver = await prisma.user.findUnique({ where: { id: finalApprovedById }, select: { id: true } })
      if (!approver) finalApprovedById = undefined
    }

    await prisma.approvalLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        status: input.status ?? ApprovalStatus.PENDING,
        catatan: input.catatan,
        requestedById: input.requestedById,
        approvedById: finalApprovedById,
      },
    })
  } catch (error) {
    console.warn("Approval log write skipped:", error)
  }
}
