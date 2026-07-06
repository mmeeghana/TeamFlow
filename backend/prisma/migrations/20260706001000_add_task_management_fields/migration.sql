ALTER TYPE "TaskPriority" ADD VALUE IF NOT EXISTS 'CRITICAL';

ALTER TABLE "Task"
RENAME COLUMN "createdById" TO "creatorId";

ALTER TABLE "Task"
ADD COLUMN "estimatedHours" DOUBLE PRECISION;

DROP INDEX IF EXISTS "Task_createdById_idx";
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");
