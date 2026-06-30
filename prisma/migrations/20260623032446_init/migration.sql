-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ROOT', 'ADMIN', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "Products" (
    "id_product" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sku" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "unit_type" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "id_category" INTEGER NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id_product")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id_category" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id_category")
);

-- CreateTable
CREATE TABLE "Suppliers" (
    "id_supplier" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suppliers_pkey" PRIMARY KEY ("id_supplier")
);

-- CreateTable
CREATE TABLE "ProductReceptions" (
    "id_reception" SERIAL NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "id_supplier" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReceptions_pkey" PRIMARY KEY ("id_reception")
);

-- CreateTable
CREATE TABLE "Customers" (
    "id_customer" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "first_surname" TEXT NOT NULL,
    "second_surname" TEXT NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customers_pkey" PRIMARY KEY ("id_customer")
);

-- CreateTable
CREATE TABLE "Sales" (
    "id_sale" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL,
    "operation_number" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id_sale")
);

-- CreateTable
CREATE TABLE "SaleDetails" (
    "id_detail" SERIAL NOT NULL,
    "id_sale" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleDetails_pkey" PRIMARY KEY ("id_detail")
);

-- CreateTable
CREATE TABLE "StockMovements" (
    "id_movement" SERIAL NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "movement_type" TEXT NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovements_pkey" PRIMARY KEY ("id_movement")
);

-- CreateTable
CREATE TABLE "Users" (
    "id_user" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "Products_sku_key" ON "Products"("sku");

-- CreateIndex
CREATE INDEX "Products_name_idx" ON "Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "Categories"("name");

-- CreateIndex
CREATE INDEX "Categories_name_idx" ON "Categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Suppliers_name_key" ON "Suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Suppliers_ruc_key" ON "Suppliers"("ruc");

-- CreateIndex
CREATE INDEX "ProductReceptions_date_idx" ON "ProductReceptions"("date");

-- CreateIndex
CREATE INDEX "ProductReceptions_id_supplier_idx" ON "ProductReceptions"("id_supplier");

-- CreateIndex
CREATE INDEX "ProductReceptions_id_user_idx" ON "ProductReceptions"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "Customers_dni_key" ON "Customers"("dni");

-- CreateIndex
CREATE INDEX "Customers_name_idx" ON "Customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sales_operation_number_key" ON "Sales"("operation_number");

-- CreateIndex
CREATE INDEX "Sales_date_idx" ON "Sales"("date");

-- CreateIndex
CREATE INDEX "Sales_id_user_idx" ON "Sales"("id_user");

-- CreateIndex
CREATE INDEX "Sales_id_customer_idx" ON "Sales"("id_customer");

-- CreateIndex
CREATE INDEX "StockMovements_id_product_idx" ON "StockMovements"("id_product");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_refreshToken_key" ON "Users"("refreshToken");

-- CreateIndex
CREATE INDEX "Users_name_idx" ON "Users"("name");

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "Categories"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReceptions" ADD CONSTRAINT "ProductReceptions_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Products"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReceptions" ADD CONSTRAINT "ProductReceptions_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "Suppliers"("id_supplier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReceptions" ADD CONSTRAINT "ProductReceptions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "Customers"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetails" ADD CONSTRAINT "SaleDetails_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "Sales"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetails" ADD CONSTRAINT "SaleDetails_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Products"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovements" ADD CONSTRAINT "StockMovements_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Products"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;
