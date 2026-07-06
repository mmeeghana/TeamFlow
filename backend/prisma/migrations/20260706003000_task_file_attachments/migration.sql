DROP INDEX IF EXISTS "Attachment_commentId_idx";

ALTER TABLE "Attachment" DROP CONSTRAINT IF EXISTS "Attachment_commentId_fkey";

ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "commentId";

ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "url";
