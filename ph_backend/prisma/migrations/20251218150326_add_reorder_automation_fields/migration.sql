-- CreateEnum
CREATE TYPE "SupplierSource" AS ENUM ('PREVIOUS', 'PUBLIC');

-- AlterEnum
ALTER TYPE "ReorderStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "reorder_requests" ADD COLUMN     "actual_cost" DECIMAL(10,2),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_sent_at" TIMESTAMP(3),
ADD COLUMN     "supplier_email" TEXT,
ADD COLUMN     "supplier_name" TEXT,
ADD COLUMN     "supplier_source" "SupplierSource",
ADD COLUMN     "supplier_url" TEXT;
