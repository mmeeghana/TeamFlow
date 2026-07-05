-- Add email verification and password reset OTP fields to users.
ALTER TABLE "User"
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verificationOtpHash" TEXT,
ADD COLUMN "verificationOtpExpires" TIMESTAMP(3),
ADD COLUMN "passwordResetOtpHash" TEXT,
ADD COLUMN "passwordResetOtpExpires" TIMESTAMP(3);

CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");
