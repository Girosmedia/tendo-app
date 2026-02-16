-- AlterTable
ALTER TABLE "members" ADD COLUMN     "estimated_cost" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "project_expenses" ADD COLUMN     "milestone_id" TEXT;

-- AlterTable
ALTER TABLE "project_milestones" ADD COLUMN     "estimated_cost" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "project_resources" ADD COLUMN     "milestone_id" TEXT;

-- CreateIndex
CREATE INDEX "project_expenses_milestone_id_idx" ON "project_expenses"("milestone_id");

-- CreateIndex
CREATE INDEX "project_resources_milestone_id_idx" ON "project_resources"("milestone_id");

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
