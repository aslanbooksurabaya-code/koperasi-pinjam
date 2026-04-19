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
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
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
    await prisma.approvalLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        status: input.status ?? ApprovalStatus.PENDING,
        catatan: input.catatan,
        requestedById: input.requestedById,
        approvedById: input.approvedById,
      },
    })
  } catch (error) {
    console.warn("Approval log write skipped:", error)
  }
}
