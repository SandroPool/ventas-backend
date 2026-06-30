const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, validatePositiveNumber, assertExists, getProductStock, recordStockIn, recordStockOut } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { search, date } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let sales = [];
    let total = 0;

    if (search?.trim()) {
        const normalizedSearch = normalizeSearchTerm(search);

        const query = `
            SELECT s.*, c.name AS customer_name
            FROM "Sales" s
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            WHERE 
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(s.payment_method, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY s."createdAt" DESC
            LIMIT $2 OFFSET $3
        `;

        sales = await prisma.$queryRawUnsafe(query, `%${normalizedSearch}%`, limit, skip);

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM "Sales" s
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            WHERE 
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(s.payment_method, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearch}%`);
        total = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
    } else {
        total = await prisma.sales.count();
        sales = await prisma.sales.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                customer: { select: { name: true, first_surname: true, second_surname: true } },
                details: { include: { product: true } }
            }
        });
    }

    res.json(paginatedResponse(sales, total, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { id_user, id_customer, payment_method, details, operation_number } = req.body;

    for (const detail of details) {
        validatePositiveNumber(detail.quantity, "La cantidad");
        validatePositiveNumber(detail.unit_price, "El precio unitario");
    }

    await assertExists(prisma, 'users', 'id_user', id_user, "El usuario no existe");
    await assertExists(prisma, 'customers', 'id_customer', id_customer, "El cliente no existe");

    const productIds = details.map(d => d.id_product);
    const existingProducts = await prisma.products.findMany({
        where: { id_product: { in: productIds } },
        select: { id_product: true }
    });

    const existingProductIds = existingProducts.map(p => p.id_product);
    const missingProducts = productIds.filter(id => !existingProductIds.includes(id));

    if (missingProducts.length > 0) {
        return res.status(400).json({ error: `Los siguientes productos no existen: ${missingProducts.join(", ")}` });
    }

    for (const item of details) {
        const stockActual = await getProductStock(prisma, item.id_product);
        if (stockActual < item.quantity) {
            return res.status(400).json({ error: `Stock insuficiente para el producto ID: ${item.id_product}` });
        }
    }
    const total = details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);

    const sale = await prisma.$transaction(async (prisma) => {
        const newSale = await prisma.sales.create({
            data: {
                id_user,
                id_customer,
                payment_method,
                operation_number,
                total,
                details: {
                    create: details.map(d => ({
                        id_product: d.id_product,
                        quantity: d.quantity,
                        unit_price: d.unit_price
                    }))
                }
            },
            include: { details: true }
        });

        await recordStockOut(prisma, details, newSale.id_sale);

        return newSale;
    });

    res.status(201).json(sale);
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { id_customer, payment_method, details } = req.body;

    for (const detail of details) {
        validatePositiveNumber(detail.quantity, "La cantidad");
        validatePositiveNumber(detail.unit_price, "El precio unitario");
    }

    const saleId = parseInt(id);

    const updatedSale = await prisma.$transaction(async (prisma) => {
        const existingSale = await prisma.sales.findUnique({
            where: { id_sale: saleId },
            include: { details: true }
        });

        if (!existingSale) {
            throw new Error("Venta no encontrada");
        }

        await recordStockIn(prisma, existingSale.details, saleId);

        const total = details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);

        const updatedSale = await prisma.sales.update({
            where: { id_sale: saleId },
            data: {
                id_customer,
                payment_method,
                total,
                details: {
                    deleteMany: {},
                    create: details.map(d => ({
                        id_product: d.id_product,
                        quantity: d.quantity,
                        unit_price: d.unit_price
                    }))
                }
            },
            include: { details: true }
        });

        await recordStockOut(prisma, details, saleId);

        return updatedSale;
    });

    res.json(updatedSale);
});
