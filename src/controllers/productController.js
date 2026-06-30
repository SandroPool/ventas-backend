const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, validatePositiveNumber, assertExists, getProductsStock } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let products = [];
    let totalProducts = 0;

    if (searchTerm.trim()) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT * FROM "Products"
            WHERE 
              LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
              LOWER(translate(description, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY id_product
            LIMIT $2 OFFSET $3
        `;

        products = await prisma.$queryRawUnsafe(
            query,
            `%${normalizedSearchTerm}%`,
            limit,
            skip
        );

        const countQuery = `
            SELECT COUNT(*) as total FROM "Products"
            WHERE 
              LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
              LOWER(translate(description, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(
            countQuery,
            `%${normalizedSearchTerm}%`
        );
        totalProducts = parseInt(totalResult[0].total);
    } else {
        totalProducts = await prisma.products.count();
        products = await prisma.products.findMany({
            skip,
            take: limit,
            select: {
                id_product: true,
                name: true,
                description: true,
                sku: true,
                price: true,
                unit_type: true,
                status: true,
                createdAt: true,
                id_category: true,
                fecha_vencimiento: true,
            },
        });
    }

    const productIds = products.map((p) => p.id_product);
    const stockData = await getProductsStock(prisma, productIds);

    products = products.map((product) => {
        const stockInfo = stockData.find(
            (s) => s.id_product === product.id_product
        );
        return {
            ...product,
            stock: stockInfo?.stock || 0,
        };
    });

    res.json(paginatedResponse(products, totalProducts, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { name, description, price, unit_type, id_category, fecha_vencimiento } = req.body;

    const parsedPrice = parseFloat(price);
    validatePositiveNumber(parsedPrice, "El precio");

    const dataToCreate = {
        name: name.trim(),
        price: parsedPrice,
        unit_type,
        id_category: parseInt(id_category, 10),
        description: description?.trim(),
    };

    if (fecha_vencimiento) {
        dataToCreate.fecha_vencimiento = new Date(fecha_vencimiento);
    }

    const newProduct = await prisma.products.create({
        data: dataToCreate,
    });
    res.status(201).json(newProduct);
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, unit_type, id_category, status, sku, fecha_vencimiento } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: "El ID del producto no es válido" });
    }

    await assertExists(prisma, 'products', 'id_product', productId, "Producto no encontrado");

    let parsedPrice;
    if (price !== undefined) {
        parsedPrice = parseFloat(price);
        validatePositiveNumber(parsedPrice, "El precio");
    }

    const dataToUpdate = {
        name: name?.trim(),
        description: description?.trim(),
        price: price !== undefined ? parsedPrice : undefined,
        unit_type,
        id_category: id_category !== undefined ? parseInt(id_category, 10) : undefined,
        status,
        sku: sku?.trim(),
    };

    if (fecha_vencimiento !== undefined) {
        dataToUpdate.fecha_vencimiento = fecha_vencimiento ? new Date(fecha_vencimiento) : null;
    }

    const updatedProduct = await prisma.products.update({
        where: { id_product: productId },
        data: dataToUpdate,
    });

    res.json(updatedProduct);
});
