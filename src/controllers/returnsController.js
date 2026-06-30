const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, assertExists, recordStockIn, parseId } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let returns = [];
    let total = 0;

    if (searchTerm.trim()) {
        const normalizedSearch = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT r.*, s.operation_number, c.name AS customer_name, u.name AS user_name
            FROM "Returns" r
            LEFT JOIN "Sales" s ON r.id_sale = s.id_sale
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            LEFT JOIN "Users" u ON r.id_user = u.id_user
            WHERE 
                LOWER(translate(s.operation_number, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(r.reason, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY r."createdAt" DESC
            LIMIT $2 OFFSET $3
        `;
        returns = await prisma.$queryRawUnsafe(query, `%${normalizedSearch}%`, limit, skip);

        const countQuery = `
            SELECT COUNT(*) AS total FROM "Returns" r
            LEFT JOIN "Sales" s ON r.id_sale = s.id_sale
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            WHERE 
                LOWER(translate(s.operation_number, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(r.reason, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearch}%`);
        total = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
    } else {
        total = await prisma.returns.count();
        returns = await prisma.returns.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                sale: { select: { operation_number: true } },
                user: { select: { name: true } }
            }
        });
    }

    res.json(paginatedResponse(returns, total, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { id_sale, id_user, reason, details } = req.body;

    const sale = await prisma.sales.findUnique({
        where: { id_sale },
        include: { details: true }
    });

    if (!sale) {
        return res.status(404).json({ error: "La venta no existe" });
    }

    const totalAmount = details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);

    const newReturn = await prisma.$transaction(async (tx) => {
        const created = await tx.returns.create({
            data: {
                id_sale,
                id_user,
                reason,
                total_amount: totalAmount,
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

        await recordStockIn(tx, details, created.id_return);

        const totalReturned = await tx.returnDetails.aggregate({
            _sum: { quantity: true },
            where: { id_return: { in: (await tx.returns.findMany({
                where: { id_sale },
                select: { id_return: true }
            })).map(r => r.id_return) } }
        });

        const returnedQty = totalReturned._sum.quantity || 0;
        const soldQty = sale.details.reduce((s, d) => s + d.quantity, 0);
        const newStatus = returnedQty >= soldQty ? "FULLY_RETURNED" : "PARTIALLY_RETURNED";

        await tx.sales.update({
            where: { id_sale },
            data: { status: newStatus }
        });

        return created;
    });

    res.status(201).json(newReturn);
});

exports.getById = asyncHandler(async (req, res) => {
    const returnRecord = await prisma.returns.findUnique({
        where: { id_return: parseId(req) },
        include: {
            details: { include: { product: true } },
            sale: { include: { customer: true } },
            user: { select: { name: true } }
        }
    });

    if (!returnRecord) {
        return res.status(404).json({ error: "Devolución no encontrada" });
    }

    res.json(returnRecord);
});

exports.getBySale = asyncHandler(async (req, res) => {
    const { id_sale } = req.params;
    const returns = await prisma.returns.findMany({
        where: { id_sale: parseInt(id_sale) },
        include: {
            details: { include: { product: true } },
            user: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(returns);
});
