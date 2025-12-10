-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PHARMACIST', 'CASHIER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'CREDIT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'PENDING', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReorderStatus" AS ENUM ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PHARMACIST',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT false,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "sku" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "supplier_id" TEXT,
    "location" TEXT,
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "cash_received" DECIMAL(10,2),
    "change_given" DECIMAL(10,2),
    "transaction_id" TEXT,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_requests" (
    "id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_qty" INTEGER NOT NULL,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL,
    "status" "ReorderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "ordered_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "supplier_id" TEXT,
    "estimated_cost" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_histories" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "doctor_name" TEXT,
    "prescription_date" TIMESTAMP(3),
    "medications" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "customer_address" TEXT,
    "notes" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drugs_sku_key" ON "drugs"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_email_key" ON "suppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_requests" ADD CONSTRAINT "reorder_requests_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_requests" ADD CONSTRAINT "reorder_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_requests" ADD CONSTRAINT "reorder_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_requests" ADD CONSTRAINT "reorder_requests_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_histories" ADD CONSTRAINT "prescription_histories_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
