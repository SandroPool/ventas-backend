const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse } = require("../utils");

exports.getAllStock = asyncHandler(async (req, res) => {
    const { searchTerm = "", dateFrom, dateTo } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    let expirationRange;
    if (dateFrom !== undefined || dateTo !== undefined) {
        const isISODate = (value) => {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const date = new Date(`${value}T00:00:00.000Z`);
            return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
        };
        if (!isISODate(dateFrom) || !isISODate(dateTo) || dateFrom > dateTo) {
            return res.status(400).json({ error: "El rango de fechas no es válido" });
        }

        const from = new Date(`${dateFrom}T00:00:00.000Z`);
        const to = new Date(`${dateTo}T00:00:00.000Z`);
        to.setUTCDate(to.getUTCDate() + 1);
        expirationRange = { gte: from, lt: to, dateFrom, dateTo };
    }

    let stock = [];
    let totalProducts = 0;

    if (searchTerm.trim()) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
        const searchCondition = `(
                LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(p.description, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(p.sku, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            )`;
        const filterValues = [`%${normalizedSearchTerm}%`];
        let expirationCondition = "";
        if (expirationRange) {
            filterValues.push(expirationRange.dateFrom, expirationRange.dateTo);
            expirationCondition = ` AND p.fecha_vencimiento::date >= $2::date AND p.fecha_vencimiento::date <= $3::date`;
        }
        const whereClause = `${searchCondition}${expirationCondition}`;

        const query = `
            SELECT p.id_product, p.name, p.description, p.image, p.fecha_vencimiento,
                p.sku, p.price, p.unit_type,
                COALESCE(c.name, 'Sin categoría') AS category,
                COALESCE(SUM(sm.quantity), 0) AS stock
            FROM "Products" p
            LEFT JOIN "Categories" c ON p.id_category = c.id_category
            LEFT JOIN "StockMovements" sm ON sm.id_product = p.id_product
            WHERE ${whereClause}
            GROUP BY p.id_product, c.name
            ORDER BY p.id_product
            LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2};
        `;

        stock = await prisma.$queryRawUnsafe(query, ...filterValues, limit, skip);

        const countQuery = `
            SELECT COUNT(DISTINCT p.id_product) AS total
            FROM "Products" p
            WHERE ${whereClause};
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, ...filterValues);
        totalProducts = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
    } else {
        const where = expirationRange
            ? { fecha_vencimiento: { gte: expirationRange.gte, lt: expirationRange.lt } }
            : undefined;
        totalProducts = await prisma.products.count({ where });
        const products = await prisma.products.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id_product: "asc" },
            include: {
                category: {
                    select: { name: true }
                },
                StockMovements: {
                    select: { quantity: true }
                }
            }
        });

        stock = products.map(product => {
            const totalStock = (product.StockMovements || []).reduce((total, mov) => total + mov.quantity, 0);

            return {
                id_product: product.id_product,
                name: product.name,
                description: product.description,
                image: product.image,
                fecha_vencimiento: product.fecha_vencimiento,
                sku: product.sku,
                price: product.price,
                unit_type: product.unit_type,
                category: product.category?.name || "Sin categoría",
                stock: totalStock
            };
        });
    }

    res.json(paginatedResponse(stock, totalProducts, page, limit));
});
