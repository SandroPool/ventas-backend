const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, validatePositiveNumber, assertExists, getProductsStock, getProductsPurchasePrices, logger } = require("../utils");
const { saveProductImage, deleteProductImage } = require("../utils/productImage");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "", dateFrom, dateTo } = req.query;
    const activeOnly = req.query.activeOnly === "true";
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

    let products = [];
    let totalProducts = 0;

    if (searchTerm.trim()) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
        const filterValues = [`%${normalizedSearchTerm}%`];
        const whereConditions = [`
            (
                LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(description, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            )
        `];
        if (activeOnly) whereConditions.push("status = true");
        if (expirationRange) {
            const fromParameter = filterValues.length + 1;
            filterValues.push(expirationRange.dateFrom, expirationRange.dateTo);
            whereConditions.push(`fecha_vencimiento::date >= $${fromParameter}::date AND fecha_vencimiento::date <= $${fromParameter + 1}::date`);
        }
        const whereClause = whereConditions.join(" AND ");

        const query = `
            SELECT * FROM "Products"
            WHERE ${whereClause}
            ORDER BY id_product
            LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}
        `;

        products = await prisma.$queryRawUnsafe(query, ...filterValues, limit, skip);

        const countQuery = `
            SELECT COUNT(*) as total FROM "Products"
            WHERE ${whereClause}
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, ...filterValues);
        totalProducts = parseInt(totalResult[0].total);
    } else {
        const where = {};
        if (activeOnly) where.status = true;
        if (expirationRange) {
            where.fecha_vencimiento = { gte: expirationRange.gte, lt: expirationRange.lt };
        }
        const productFilter = Object.keys(where).length > 0 ? where : undefined;
        totalProducts = await prisma.products.count({ where: productFilter });
        products = await prisma.products.findMany({
            skip,
            take: limit,
            where: productFilter,
            select: {
                id_product: true,
                name: true,
                description: true,
                sku: true,
                price: true,
                unit_type: true,
                status: true,
                image: true,
                createdAt: true,
                id_category: true,
                fecha_vencimiento: true,
            },
        });
    }

    const productIds = products.map((p) => p.id_product);
    const stockData = await getProductsStock(prisma, productIds);
    const purchasePriceMap = await getProductsPurchasePrices(prisma, productIds);

    products = products.map((product) => {
        const stockInfo = stockData.find(
            (s) => s.id_product === product.id_product
        );
        return {
            ...product,
            stock: stockInfo?.stock || 0,
            min_sale_price: purchasePriceMap.get(product.id_product) ?? 0,
        };
    });

    res.json(paginatedResponse(products, totalProducts, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { name, description, price, unit_type, id_category, fecha_vencimiento } = req.body;

    const parsedPrice = parseFloat(price);
    validatePositiveNumber(parsedPrice, "El precio");

    const imagePath = req.file ? await saveProductImage(req.file.buffer) : null;
    try {
        const dataToCreate = {
            name: name.trim(),
            price: parsedPrice,
            unit_type,
            id_category: parseInt(id_category, 10),
            description: description?.trim(),
            image: imagePath,
        };

        if (fecha_vencimiento) {
            dataToCreate.fecha_vencimiento = new Date(fecha_vencimiento);
        }

        const newProduct = await prisma.products.create({
            data: dataToCreate,
        });
        res.status(201).json(newProduct);
    } catch (error) {
        if (imagePath) {
            try {
                await deleteProductImage(imagePath);
            } catch (cleanupError) {
                logger.error(`No se pudo limpiar la imagen del producto nuevo: ${cleanupError.message}`);
            }
        }
        throw error;
    }
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, unit_type, id_category, status, sku, fecha_vencimiento } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: "El ID del producto no es válido" });
    }

    const existingProduct = await assertExists(
        prisma,
        "products",
        "id_product",
        productId,
        "Producto no encontrado"
    );

    let parsedPrice;
    if (price !== undefined) {
        parsedPrice = parseFloat(price);
        validatePositiveNumber(parsedPrice, "El precio");
    }

    let parsedStatus;
    if (status !== undefined) {
        if (status === true || status === "true") {
            parsedStatus = true;
        } else if (status === false || status === "false") {
            parsedStatus = false;
        } else {
            const error = new Error("El estado del producto no es válido");
            error.statusCode = 400;
            throw error;
        }
    }

    const dataToUpdate = {
        name: name?.trim(),
        description: description?.trim(),
        price: price !== undefined ? parsedPrice : undefined,
        unit_type,
        id_category: id_category !== undefined ? parseInt(id_category, 10) : undefined,
        status: parsedStatus,
        sku: sku?.trim(),
    };

    if (fecha_vencimiento !== undefined) {
        dataToUpdate.fecha_vencimiento = fecha_vencimiento ? new Date(fecha_vencimiento) : null;
    }

    let newImagePath;
    try {
        if (req.file) {
            newImagePath = await saveProductImage(req.file.buffer);
            dataToUpdate.image = newImagePath;
        }

        const updatedProduct = await prisma.products.update({
            where: { id_product: productId },
            data: dataToUpdate,
        });
        if (newImagePath && existingProduct.image) {
            try {
                await deleteProductImage(existingProduct.image);
            } catch (error) {
                logger.error(`No se pudo eliminar la imagen anterior del producto ${productId}: ${error.message}`);
            }
        }
        res.json(updatedProduct);
    } catch (error) {
        if (newImagePath) {
            try {
                await deleteProductImage(newImagePath);
            } catch (cleanupError) {
                logger.error(`No se pudo limpiar la imagen nueva del producto ${productId}: ${cleanupError.message}`);
            }
        }
        throw error;
    }
});
