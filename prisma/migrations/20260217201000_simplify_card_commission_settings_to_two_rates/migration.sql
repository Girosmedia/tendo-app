-- Add simplified commission columns
ALTER TABLE "organization_settings"
  ADD COLUMN "card_debit_commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN "card_credit_commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Preserve existing values (taking current Transbank rates as baseline)
UPDATE "organization_settings"
SET
  "card_debit_commission_rate" = COALESCE("transbank_debit_rate", 0),
  "card_credit_commission_rate" = COALESCE("transbank_credit_rate", 0);

-- Drop old per-provider matrix fields
ALTER TABLE "organization_settings"
  DROP COLUMN "default_card_provider",
  DROP COLUMN "transbank_debit_rate",
  DROP COLUMN "transbank_credit_rate",
  DROP COLUMN "mercado_pago_debit_rate",
  DROP COLUMN "mercado_pago_credit_rate",
  DROP COLUMN "getnet_debit_rate",
  DROP COLUMN "getnet_credit_rate",
  DROP COLUMN "other_debit_rate",
  DROP COLUMN "other_credit_rate";
