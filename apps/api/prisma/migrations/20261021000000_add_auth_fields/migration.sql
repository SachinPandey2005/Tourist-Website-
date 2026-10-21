-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");
