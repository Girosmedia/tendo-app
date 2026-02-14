-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE INDEX "products_organization_id_barcode_idx" ON "products"("organization_id", "barcode");
