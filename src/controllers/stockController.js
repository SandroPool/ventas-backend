const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse } = require("../utils");

exports.getAllStock = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let stock = [];
    let totalProducts = 0;

    if (searchTerm.trim()) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT p.id_product, p.name, p.sku, p.price, p.unit_type, 
                COALESCE(c.name, 'Sin categoría') AS category,
                COALESCE(SUM(sm.quantity), 0) AS stock
            FROM "Products" p
            LEFT JOIN "Categories" c ON p.id_category = c.id_category
            LEFT JOIN "StockMovements" sm ON sm.id_product = p.id_product
            WHERE 
                LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(p.sku, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            GROUP BY p.id_product, c.name
            ORDER BY p.id_product
            LIMIT $2 OFFSET $3;
        `;

        stock = await prisma.$queryRawUnsafe(query, `%${normalizedSearchTerm}%`, limit, skip);

        const countQuery = `
            SELECT COUNT(DISTINCT p.id_product) AS total
            FROM "Products" p
            WHERE 
                LOWER(translate(p.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(p.sku, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1);
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
        totalProducts = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
    } else {
        totalProducts = await prisma.products.count();
        const products = await prisma.products.findMany({
            skip,
            take: limit,
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
