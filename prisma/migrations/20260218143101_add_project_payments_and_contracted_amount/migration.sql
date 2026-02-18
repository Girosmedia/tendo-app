-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "contracted_amount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "project_payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_payments_organization_id_idx" ON "project_payments"("organization_id");

-- CreateIndex
CREATE INDEX "project_payments_project_id_idx" ON "project_payments"("project_id");

-- CreateIndex
CREATE INDEX "project_payments_paid_at_idx" ON "project_payments"("paid_at");

-- AddForeignKey
ALTER TABLE "project_payments" ADD CONSTRAINT "project_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_payments" ADD CONSTRAINT "project_payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
