const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, validatePositiveNumber, assertExists } = require("../utils");
const { MOVEMENT_IN } = require("../configs/constants");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

    const query = `
        SELECT pr.*, 
               p.id_product, p.name AS product_name, p.price,
               s.id_supplier, s.name AS supplier_name,
               u.id_user, u.name AS user_name
        FROM "ProductReceptions" pr
        LEFT JOIN "Products" p ON pr.id_product = p.id_product
        LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
        LEFT JOIN "Users" u ON pr.id_user = u.id_user
        WHERE 
            LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(s.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(u.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        ORDER BY pr."createdAt" DESC
        LIMIT $2 OFFSET $3
    `;

    const receptions = await prisma.$queryRawUnsafe(
        query,
        `%${normalizedSearchTerm}%`,
        limit,
        skip
    );

    const countQuery = `
        SELECT COUNT(*) as total FROM "ProductReceptions" pr
        LEFT JOIN "Products" p ON pr.id_product = p.id_product
        LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
        LEFT JOIN "Users" u ON pr.id_user = u.id_user
        WHERE 
            LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(s.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
            LOWER(translate(u.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
    `;
    const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
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

    if (purchase_price !== undefined) {
        const parsedPurchasePrice = parseFloat(purchase_price);
        validatePositiveNumber(parsedPurchasePrice, "El precio de compra");
    }

    if (id_product) await assertExists(prisma, 'products', 'id_product', id_product, "El producto no existe");
    if (id_supplier) await assertExists(prisma, 'suppliers', 'id_supplier', id_supplier, "El proveedor no existe");
    if (id_user) await assertExists(prisma, 'users', 'id_user', id_user, "El usuario no existe");

    const updatedReception = await prisma.$transaction(async (prisma) => {
        const updated = await prisma.productReceptions.update({
            where: { id_reception: receptionId },
            data: { id_product, quantity, purchase_price, id_supplier, id_user }
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
