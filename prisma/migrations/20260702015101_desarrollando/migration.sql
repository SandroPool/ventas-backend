-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE "Returns" (
    "id_return" SERIAL NOT NULL,
    "id_sale" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "id_user" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Returns_pkey" PRIMARY KEY ("id_return")
);

-- CreateTable
CREATE TABLE "ReturnDetails" (
    "id_return_detail" SERIAL NOT NULL,
    "id_return" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnDetails_pkey" PRIMARY KEY ("id_return_detail")
);

-- CreateTable
CREATE TABLE "Installments" (
    "id_installment" SERIAL NOT NULL,
    "id_sale" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Installments_pkey" PRIMARY KEY ("id_installment")
);

-- CreateIndex
CREATE INDEX "Returns_id_sale_idx" ON "Returns"("id_sale");

-- CreateIndex
CREATE INDEX "ReturnDetails_id_return_idx" ON "ReturnDetails"("id_return");

-- CreateIndex
CREATE INDEX "Installments_id_sale_idx" ON "Installments"("id_sale");

-- AddForeignKey
ALTER TABLE "Returns" ADD CONSTRAINT "Returns_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "Sales"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Returns" ADD CONSTRAINT "Returns_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDetails" ADD CONSTRAINT "ReturnDetails_id_return_fkey" FOREIGN KEY ("id_return") REFERENCES "Returns"("id_return") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDetails" ADD CONSTRAINT "ReturnDetails_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Products"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installments" ADD CONSTRAINT "Installments_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "Sales"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;
