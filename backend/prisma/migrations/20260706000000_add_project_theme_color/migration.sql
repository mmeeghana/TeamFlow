ALTER TABLE "Project"
ADD COLUMN "themeColor" TEXT NOT NULL DEFAULT '#22d3ee';

CREATE INDEX "Project_name_idx" ON "Project"("name");
