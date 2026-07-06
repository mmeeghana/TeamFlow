ALTER TABLE "Comment"
RENAME COLUMN "body" TO "content";

ALTER TABLE "Comment"
ADD COLUMN "mentionedUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");
