-- Add tenor type enum for monthly/weekly installment support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenorType') THEN
    CREATE TYPE "TenorType" AS ENUM ('BULANAN', 'MINGGUAN');
  END IF;
END $$;

ALTER TABLE "pengajuan"
  ADD COLUMN IF NOT EXISTS "tenorType" "TenorType" NOT NULL DEFAULT 'BULANAN';

ALTER TABLE "pinjaman"
  ADD COLUMN IF NOT EXISTS "tenorType" "TenorType" NOT NULL DEFAULT 'BULANAN';

ALTER TABLE "pembayaran"
  ADD COLUMN IF NOT EXISTS "buktiBayarUrl" TEXT;
