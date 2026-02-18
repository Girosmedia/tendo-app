-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "CardProvider" AS ENUM ('TRANSBANK', 'MERCADO_PAGO', 'GETNET', 'OTHER');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "card_commission_amount" DECIMAL(10,2),
ADD COLUMN     "card_commission_rate" DECIMAL(5,2),
ADD COLUMN     "card_provider" "CardProvider",
ADD COLUMN     "card_type" "CardType";

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "default_card_provider" "CardProvider" NOT NULL DEFAULT 'TRANSBANK',
ADD COLUMN     "getnet_credit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "getnet_debit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "mercado_pago_credit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "mercado_pago_debit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "other_credit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "other_debit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "transbank_credit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "transbank_debit_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "documents_card_type_idx" ON "documents"("card_type");

-- CreateIndex
CREATE INDEX "documents_card_provider_idx" ON "documents"("card_provider");
