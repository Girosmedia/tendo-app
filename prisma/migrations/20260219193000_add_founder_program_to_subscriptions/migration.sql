-- AlterTable
ALTER TABLE "subscriptions"
ADD COLUMN "is_founder_partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "discount_percent" INTEGER NOT NULL DEFAULT 0;
