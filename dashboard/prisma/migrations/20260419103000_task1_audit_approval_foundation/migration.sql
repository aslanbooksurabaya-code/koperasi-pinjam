-- Task 1 foundation: approval, audit, collector target, notification tables

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'DISBURSE',
  'PAYMENT',
  'CASH',
  'LOGIN',
  'LOGOUT'
);

CREATE TYPE "ApprovalEntityType" AS ENUM ('PENGAJUAN', 'PEMBAYARAN', 'KAS');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "NotifikasiJenis" AS ENUM ('JATUH_TEMPO', 'TUNGGAKAN', 'APPROVAL', 'KAS', 'REMINDER', 'SYSTEM');

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "action" "AuditAction" NOT NULL,
  "beforeData" JSONB,
  "afterData" JSONB,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_logs" (
  "id" TEXT NOT NULL,
  "entityType" "ApprovalEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "catatan" TEXT,
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kolektor_targets" (
  "id" TEXT NOT NULL,
  "kolektorId" TEXT NOT NULL,
  "periodMonth" INTEGER NOT NULL,
  "periodYear" INTEGER NOT NULL,
  "targetTagihan" DECIMAL(15,2) NOT NULL,
  "realisasiTagihan" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "targetKunjungan" INTEGER NOT NULL DEFAULT 0,
  "realisasiKunjungan" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kolektor_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifikasi" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "jenis" "NotifikasiJenis" NOT NULL,
  "judul" TEXT NOT NULL,
  "pesan" TEXT NOT NULL,
  "link" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX "approval_logs_entityType_entityId_idx" ON "approval_logs"("entityType", "entityId");
CREATE INDEX "approval_logs_requestedById_createdAt_idx" ON "approval_logs"("requestedById", "createdAt");
CREATE INDEX "kolektor_targets_periodYear_periodMonth_idx" ON "kolektor_targets"("periodYear", "periodMonth");
CREATE INDEX "notifikasi_userId_isRead_createdAt_idx" ON "notifikasi"("userId", "isRead", "createdAt");

CREATE UNIQUE INDEX "kolektor_targets_kolektorId_periodMonth_periodYear_key"
  ON "kolektor_targets"("kolektorId", "periodMonth", "periodYear");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "approval_logs"
  ADD CONSTRAINT "approval_logs_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_logs"
  ADD CONSTRAINT "approval_logs_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "kolektor_targets"
  ADD CONSTRAINT "kolektor_targets_kolektorId_fkey"
  FOREIGN KEY ("kolektorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifikasi"
  ADD CONSTRAINT "notifikasi_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
