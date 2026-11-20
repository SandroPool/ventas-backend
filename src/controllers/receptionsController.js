const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, validatePositiveNumber, assertExists } = require("../utils");
const { MOVEMENT_IN } = require("../configs/constants");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "", dateFrom, dateTo } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
    const filterValues = [`%${normalizedSearchTerm}%`];
    const whereConditions = [`
        (
            LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(s.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(u.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        )
    `];

    if (dateFrom !== undefined || dateTo !== undefined) {
        const isISODate = (value) => {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const date = new Date(`${value}T00:00:00.000Z`);
            return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
        };
        if (!isISODate(dateFrom) || !isISODate(dateTo) || dateFrom > dateTo) {
            return res.status(400).json({ error: "El rango de fechas no es válido" });
        }

        filterValues.push(dateFrom, dateTo);
        whereConditions.push(`pr.date::date >= $2::date AND pr.date::date <= $3::date`);
    }

    const whereClause = whereConditions.join(" AND ");

    const query = `
        SELECT pr.*, 
               p.id_product, p.name AS product_name, p.price,
               s.id_supplier, s.name AS supplier_name,
               u.id_user, u.name AS user_name
        FROM "ProductReceptions" pr
        LEFT JOIN "Products" p ON pr.id_product = p.id_product
        LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
        LEFT JOIN "Users" u ON pr.id_user = u.id_user
        WHERE ${whereClause}
        ORDER BY pr."createdAt" DESC
        LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}
    `;

    const receptions = await prisma.$queryRawUnsafe(
        query,
        ...filterValues,
        limit,
        skip
    );

    const countQuery = `
        SELECT COUNT(*) as total FROM "ProductReceptions" pr
        LEFT JOIN "Products" p ON pr.id_product = p.id_product
        LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
        LEFT JOIN "Users" u ON pr.id_user = u.id_user
        WHERE ${whereClause}
    `;
    const totalResult = await prisma.$queryRawUnsafe(countQuery, ...filterValues);
    const total = parseInt(totalResult[0].total);

    res.json(paginatedResponse(receptions, total, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { id_product, quantity, purchase_price, id_supplier, id_user, date } = req.body;

    const parsedQuantity = parseFloat(quantity);
    const parsedPurchasePrice = parseFloat(purchase_price);

    validatePositiveNumber(parsedQuantity, "La cantidad");
    validatePositiveNumber(parsedPurchasePrice, "El precio de compra");

    const receptionDate = date ? new Date(date) : new Date();

    await assertExists(prisma, 'products', 'id_product', id_product, "El producto no existe");
    await assertExists(prisma, 'suppliers', 'id_supplier', id_supplier, "El proveedor no existe");
    await assertExists(prisma, 'users', 'id_user', id_user, "El usuario no existe");

    const newReception = await prisma.productReceptions.create({
        data: { id_product, quantity: parsedQuantity, purchase_price: parsedPurchasePrice, id_supplier, id_user, date: receptionDate }
    });

    await prisma.stockMovements.create({
        data: {
            id_product,
            quantity: parsedQuantity,
            movement_type: MOVEMENT_IN,
            reference_id: newReception.id_reception
        }
    });

    res.status(201).json(newReception);
});

exports.createBatch = asyncHandler(async (req, res) => {
    const { date, items } = req.body;
    const id_user = req.user.id;
    const receptionDate = new Date(date);

    if (Number.isNaN(receptionDate.getTime())) {
        return res.status(400).json({ error: "Fecha inválida" });
    }

    for (const item of items) {
        validatePositiveNumber(Number(item.quantity), "La cantidad");
        validatePositiveNumber(Number(item.purchase_price), "El precio de compra");
    }

    const productIds = [...new Set(items.map((item) => Number(item.id_product)))];
    const supplierIds = [...new Set(items.map((item) => Number(item.id_supplier)))];

    const receptions = await prisma.$transaction(async (transaction) => {
        await assertExists(transaction, "users", "id_user", id_user, "El usuario no existe");

        const existingProducts = await transaction.products.findMany({
            where: { id_product: { in: productIds } },
            select: { id_product: true },
        });
        if (existingProducts.length !== productIds.length) {
            const existingIds = new Set(existingProducts.map((product) => product.id_product));
            const missingIds = productIds.filter((productId) => !existingIds.has(productId));
            const error = new Error(`Los siguientes productos no existen: ${missingIds.join(", ")}`);
            error.statusCode = 404;
            throw error;
        }

        const existingSuppliers = await transaction.suppliers.findMany({
            where: { id_supplier: { in: supplierIds } },
            select: { id_supplier: true },
        });
        if (existingSuppliers.length !== supplierIds.length) {
            const existingIds = new Set(existingSuppliers.map((supplier) => supplier.id_supplier));
            const missingIds = supplierIds.filter((supplierId) => !existingIds.has(supplierId));
            const error = new Error(`Los siguientes proveedores no existen: ${missingIds.join(", ")}`);
            error.statusCode = 404;
            throw error;
        }

        const createdReceptions = [];
        for (const item of items) {
            const id_product = Number(item.id_product);
            const id_supplier = Number(item.id_supplier);
            const quantity = Number(item.quantity);
            const purchase_price = Number(item.purchase_price);
            const reception = await transaction.productReceptions.create({
                data: {
                    id_product,
                    quantity,
                    purchase_price,
                    id_supplier,
                    id_user,
                    date: receptionDate,
                },
            });

            await transaction.stockMovements.create({
                data: {
                    id_product,
                    quantity,
                    movement_type: MOVEMENT_IN,
                    reference_id: reception.id_reception,
                },
            });
            createdReceptions.push(reception);
        }

        return createdReceptions;
    });

    res.status(201).json({ receptions });
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { id_product, quantity, purchase_price, id_supplier, id_user } = req.body;

    const receptionId = parseInt(id);
    const reception = await prisma.productReceptions.findUnique({ where: { id_reception: receptionId } });

    if (!reception) return res.status(404).json({ error: "Recepción no encontrada" });

    let parsedQuantity;
    if (quantity !== undefined) {
        parsedQuantity = parseFloat(quantity);
        validatePositiveNumber(parsedQuantity, "La cantidad");
    }

    let parsedPurchasePrice;
    if (purchase_price !== undefined) {
        parsedPurchasePrice = parseFloat(purchase_price);
        validatePositiveNumber(parsedPurchasePrice, "El precio de compra");
    }

    if (id_product) await assertExists(prisma, 'products', 'id_product', id_product, "El producto no existe");
    if (id_supplier) await assertExists(prisma, 'suppliers', 'id_supplier', id_supplier, "El proveedor no existe");
    if (id_user) await assertExists(prisma, 'users', 'id_user', id_user, "El usuario no existe");

    const updatedReception = await prisma.$transaction(async (prisma) => {
        const updated = await prisma.productReceptions.update({
            where: { id_reception: receptionId },
            data: {
                ...(id_product !== undefined && { id_product }),
                ...(quantity !== undefined && { quantity: parsedQuantity }),
                ...(purchase_price !== undefined && { purchase_price: parsedPurchasePrice }),
                ...(id_supplier !== undefined && { id_supplier }),
                ...(id_user !== undefined && { id_user })
            }
        });

        const newQty = parsedQuantity ?? reception.quantity;
        await prisma.stockMovements.updateMany({
            where: {
                reference_id: receptionId,
                movement_type: MOVEMENT_IN
            },
            data: { quantity: newQty }
        });

        return updated;
    });

    res.json(updatedReception);
});
