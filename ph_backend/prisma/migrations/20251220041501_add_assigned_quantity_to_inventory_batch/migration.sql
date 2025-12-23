-- CreateEnum
CREATE TYPE "SupplierSource" AS ENUM ('MANUAL', 'AI_SEARCH', 'EXISTING', 'PREVIOUS', 'PUBLIC');

-- AlterEnum
ALTER TYPE "ReorderStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "assigned_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slot_position" INTEGER;

-- AlterTable
ALTER TABLE "reorder_requests" ADD COLUMN     "actual_cost" DECIMAL(10,2),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_sent_at" TIMESTAMP(3),
ADD COLUMN     "supplier_email" TEXT,
ADD COLUMN     "supplier_name" TEXT,
ADD COLUMN     "supplier_source" "SupplierSource",
ADD COLUMN     "supplier_url" TEXT;

-- AlterTable
ALTER TABLE "stock_alerts" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "notification_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "device_id" TEXT,
    "platform" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cupboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" TEXT NOT NULL,
    "cupboard_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelf_items" (
    "id" TEXT NOT NULL,
    "shelf_id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelf_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fcm_token_key" ON "user_devices"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "shelf_items_shelf_id_drug_id_batch_id_key" ON "shelf_items"("shelf_id", "drug_id", "batch_id");

-- AddForeignKey
ALTER TABLE "incorrect_pick_alerts" ADD CONSTRAINT "incorrect_pick_alerts_batch_id_picked_fkey" FOREIGN KEY ("batch_id_picked") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incorrect_pick_alerts" ADD CONSTRAINT "incorrect_pick_alerts_batch_id_expected_fkey" FOREIGN KEY ("batch_id_expected") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_cupboard_id_fkey" FOREIGN KEY ("cupboard_id") REFERENCES "cupboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
