-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'TEAM_MEMBER');

CREATE TYPE "RecurrenceInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TYPE "EngagementStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE "TaskStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'WAITING_FOR_CLIENT',
    'READY_FOR_REVIEW',
    'CHANGES_REQUESTED',
    'COMPLETED'
);

-- CreateTable
CREATE TABLE
    "User" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "Client" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "contactEmail" TEXT,
        "contactPhone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "ServiceType" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isRecurring" BOOLEAN NOT NULL DEFAULT false,
        "recurrenceInterval" "RecurrenceInterval",
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "TaskTemplate" (
        "id" TEXT NOT NULL,
        "serviceTypeId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "sequence" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "Engagement" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "serviceTypeId" TEXT NOT NULL,
        "period" TEXT,
        "status" "EngagementStatus" NOT NULL DEFAULT 'ACTIVE',
        "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3),
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "Task" (
        "id" TEXT NOT NULL,
        "engagementId" TEXT NOT NULL,
        "templateId" TEXT,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
        "assignedToId" TEXT,
        "reviewerId" TEXT,
        "dueDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "AuditLog" (
        "id" TEXT NOT NULL,
        "taskId" TEXT,
        "engagementId" TEXT,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "fromStatus" TEXT,
        "toStatus" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

CREATE INDEX "User_role_idx" ON "User" ("role");

CREATE INDEX "Client_name_idx" ON "Client" ("name");

CREATE UNIQUE INDEX "ServiceType_name_key" ON "ServiceType" ("name");

CREATE INDEX "TaskTemplate_serviceTypeId_idx" ON "TaskTemplate" ("serviceTypeId");

CREATE INDEX "Engagement_clientId_idx" ON "Engagement" ("clientId");

CREATE INDEX "Engagement_status_idx" ON "Engagement" ("status");

CREATE UNIQUE INDEX "Engagement_clientId_serviceTypeId_period_key" ON "Engagement" ("clientId", "serviceTypeId", "period");

CREATE INDEX "Task_assignedToId_idx" ON "Task" ("assignedToId");

CREATE INDEX "Task_status_idx" ON "Task" ("status");

CREATE INDEX "Task_dueDate_idx" ON "Task" ("dueDate");

CREATE INDEX "Task_engagementId_idx" ON "Task" ("engagementId");

CREATE INDEX "AuditLog_taskId_idx" ON "AuditLog" ("taskId");

CREATE INDEX "AuditLog_engagementId_idx" ON "AuditLog" ("engagementId");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;