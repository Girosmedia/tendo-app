-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false;
