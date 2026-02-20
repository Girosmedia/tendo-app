-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "trial_days" INTEGER NOT NULL DEFAULT 15,
    "founder_program_enabled" BOOLEAN NOT NULL DEFAULT false,
    "founder_trial_days" INTEGER NOT NULL DEFAULT 60,
    "founder_discount_percent" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
