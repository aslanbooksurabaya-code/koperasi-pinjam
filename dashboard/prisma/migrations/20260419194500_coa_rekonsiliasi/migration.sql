-- COA (Chart of Accounts) + mapping kas_kategori + rekonsiliasi kas/bank

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountType') THEN
    CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RekonsiliasiStatus') THEN
    CREATE TYPE "RekonsiliasiStatus" AS ENUM ('DRAFT', 'SELESAI');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_code_key" ON "accounts"("code");
CREATE INDEX IF NOT EXISTS "accounts_type_isActive_idx" ON "accounts"("type", "isActive");

ALTER TABLE "kas_kategori"
ADD COLUMN IF NOT EXISTS "accountId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kas_kategori_accountId_fkey'
  ) THEN
    ALTER TABLE "kas_kategori"
    ADD CONSTRAINT "kas_kategori_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "rekonsiliasi_kas" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "periodMonth" INTEGER NOT NULL,
  "periodYear" INTEGER NOT NULL,
  "saldoStatement" DECIMAL(15,2) NOT NULL,
  "saldoBook" DECIMAL(15,2) NOT NULL,
  "selisih" DECIMAL(15,2) NOT NULL,
  "catatan" TEXT,
  "buktiUrl" TEXT,
  "status" "RekonsiliasiStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "rekonsiliasi_kas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rekonsiliasi_kas_account_period_key"
ON "rekonsiliasi_kas"("accountId", "periodMonth", "periodYear");

CREATE INDEX IF NOT EXISTS "rekonsiliasi_kas_period_idx"
ON "rekonsiliasi_kas"("periodYear", "periodMonth");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rekonsiliasi_kas_accountId_fkey'
  ) THEN
    ALTER TABLE "rekonsiliasi_kas"
    ADD CONSTRAINT "rekonsiliasi_kas_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rekonsiliasi_kas_createdById_fkey'
  ) THEN
    ALTER TABLE "rekonsiliasi_kas"
    ADD CONSTRAINT "rekonsiliasi_kas_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

