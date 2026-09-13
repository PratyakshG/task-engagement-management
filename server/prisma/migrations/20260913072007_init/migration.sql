/*
  Warnings:

  - The `fromStatus` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `toStatus` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[serviceTypeId,sequence]` on the table `TaskTemplate` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TaskTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('STATUS_CHANGE', 'APPROVED', 'CHANGES_REQUESTED', 'ENGAGEMENT_CREATED', 'TASK_ASSIGNED', 'TASK_REASSIGNED');

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL,
DROP COLUMN "fromStatus",
ADD COLUMN     "fromStatus" "TaskStatus",
DROP COLUMN "toStatus",
ADD COLUMN     "toStatus" "TaskStatus";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceType" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sequence" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Engagement_serviceTypeId_idx" ON "Engagement"("serviceTypeId");

-- CreateIndex
CREATE INDEX "Engagement_dueDate_idx" ON "Engagement"("dueDate");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplate_serviceTypeId_sequence_key" ON "TaskTemplate"("serviceTypeId", "sequence");
