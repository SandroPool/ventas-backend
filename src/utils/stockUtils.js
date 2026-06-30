const { MOVEMENT_IN, MOVEMENT_OUT } = require('../configs/constants');

const getProductStock = async (prisma, productId) => {
    const result = await prisma.stockMovements.aggregate({
        _sum: { quantity: true },
        where: { id_product: productId },
    });
    return result._sum.quantity || 0;
};

const getProductsStock = async (prisma, productIds) => {
    if (!productIds || productIds.length === 0) return [];

    // Single GROUP BY query to avoid N+1
    const raw = await prisma.$queryRaw`
        SELECT id_product, COALESCE(SUM(quantity), 0) AS stock
        FROM "StockMovements"
        WHERE id_product = ANY(${productIds})
        GROUP BY id_product
    `;

    const stockMap = {};
    for (const row of raw) {
        stockMap[row.id_product] = Number(row.stock);
    }

    return productIds.map((id_product) => ({
        id_product,
        stock: stockMap[id_product] || 0,
    }));
};

const recordStockIn = async (prisma, details, referenceId) => {
    await prisma.stockMovements.createMany({
        data: details.map((d) => ({
            id_product: d.id_product,
            quantity: Math.abs(d.quantity),
            movement_type: MOVEMENT_IN,
            reference_id: referenceId,
        })),
    });
};

const recordStockOut = async (prisma, details, referenceId) => {
    await prisma.stockMovements.createMany({
        data: details.map((d) => ({
            id_product: d.id_product,
            quantity: -Math.abs(d.quantity),
            movement_type: MOVEMENT_OUT,
            reference_id: referenceId,
        })),
    });
};

module.exports = { getProductStock, getProductsStock, recordStockIn, recordStockOut };
