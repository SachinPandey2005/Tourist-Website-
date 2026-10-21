-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "bookings" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "bookings" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_idempotencyKey_key" ON "bookings"("idempotencyKey");
