-- CreateTable
CREATE TABLE "document_payments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "card_type" "CardType",
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_payments_document_id_idx" ON "document_payments"("document_id");

-- CreateIndex
CREATE INDEX "document_payments_payment_method_idx" ON "document_payments"("payment_method");

-- AddForeignKey
ALTER TABLE "document_payments" ADD CONSTRAINT "document_payments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
