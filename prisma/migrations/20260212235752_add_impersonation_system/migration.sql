-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "impersonation_id" TEXT,
ADD COLUMN     "is_impersonating" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "impersonation_sessions" (
    "id" TEXT NOT NULL,
    "super_admin_id" TEXT NOT NULL,
    "target_organization_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "impersonation_sessions_super_admin_id_idx" ON "impersonation_sessions"("super_admin_id");

-- CreateIndex
CREATE INDEX "impersonation_sessions_target_organization_id_idx" ON "impersonation_sessions"("target_organization_id");

-- CreateIndex
CREATE INDEX "impersonation_sessions_is_active_idx" ON "impersonation_sessions"("is_active");

-- CreateIndex
CREATE INDEX "impersonation_sessions_expires_at_idx" ON "impersonation_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_is_impersonating_idx" ON "audit_logs"("is_impersonating");
