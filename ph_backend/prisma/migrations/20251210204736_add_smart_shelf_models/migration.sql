-- CreateEnum
CREATE TYPE "ShelfStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ExpiryAction" AS ENUM ('RETURN_TO_VENDOR', 'DISCOUNT', 'DISPOSE');

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "queue_position" INTEGER,
ADD COLUMN     "shelf_location_id" TEXT;

-- CreateTable
CREATE TABLE "shelf_locations" (
    "id" TEXT NOT NULL,
    "shelf_code" TEXT NOT NULL,
    "shelf_name" TEXT NOT NULL,
    "row" TEXT,
    "column" TEXT,
    "zone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "status" "ShelfStatus" NOT NULL DEFAULT 'ACTIVE',
    "qr_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelf_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incorrect_pick_alerts" (
    "id" TEXT NOT NULL,
    "shelf_location_id" TEXT NOT NULL,
    "batch_id_picked" TEXT NOT NULL,
    "batch_id_expected" TEXT NOT NULL,
    "picked_by" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incorrect_pick_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expiry_action_records" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "action" "ExpiryAction" NOT NULL,
    "performed_by" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "vendor_return" BOOLEAN NOT NULL DEFAULT false,
    "discount_amount" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expiry_action_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shelf_locations_shelf_code_key" ON "shelf_locations"("shelf_code");

-- CreateIndex
CREATE UNIQUE INDEX "shelf_locations_qr_code_key" ON "shelf_locations"("qr_code");

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_shelf_location_id_fkey" FOREIGN KEY ("shelf_location_id") REFERENCES "shelf_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incorrect_pick_alerts" ADD CONSTRAINT "incorrect_pick_alerts_shelf_location_id_fkey" FOREIGN KEY ("shelf_location_id") REFERENCES "shelf_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expiry_action_records" ADD CONSTRAINT "expiry_action_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
