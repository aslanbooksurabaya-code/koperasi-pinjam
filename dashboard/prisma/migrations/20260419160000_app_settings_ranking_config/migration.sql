-- App settings key/value store (used for configurable ranking thresholds)
CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updatedAt fresh on update (Prisma expects @updatedAt semantics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'app_settings_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION app_settings_set_updated_at_fn()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW."updatedAt" = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    CREATE TRIGGER app_settings_set_updated_at
    BEFORE UPDATE ON "app_settings"
    FOR EACH ROW
    EXECUTE FUNCTION app_settings_set_updated_at_fn();
  END IF;
END $$;
