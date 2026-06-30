const prisma = require("../configs/prisma");
const { asyncHandler, getDateRanges, getThirtyDaysAgo, getFullName } = require("../utils");

exports.getSalesSummary = asyncHandler(async (req, res) => {
    const { startOfDay, startOfWeek, startOfMonth, startOfYear } = getDateRanges();

    const whereNotCancelled = { status: { not: "FULLY_RETURNED" } };

    const [salesToday, salesWeek, salesMonth, salesYear] = await Promise.all([
        prisma.sales.aggregate({
            _sum: { total: true },
            where: { date: { gte: startOfDay }, ...whereNotCancelled }
        }),
        prisma.sales.aggregate({
            _sum: { total: true },
            where: { date: { gte: startOfWeek }, ...whereNotCancelled }
        }),
        prisma.sales.aggregate({
            _sum: { total: true },
            where: { date: { gte: startOfMonth }, ...whereNotCancelled }
        }),
        prisma.sales.aggregate({
            _sum: { total: true },
            where: { date: { gte: startOfYear }, ...whereNotCancelled }
        })
    ]);

    res.json({
        salesToday: salesToday._sum.total || 0,
        salesWeek: salesWeek._sum.total || 0,
        salesMonth: salesMonth._sum.total || 0,
        salesYear: salesYear._sum.total || 0
    });
});

exports.getPaymentMethods = asyncHandler(async (req, res) => {
    const paymentMethods = await prisma.sales.groupBy({
        by: ["payment_method"],
        _count: { payment_method: true },
        where: { status: { not: "FULLY_RETURNED" } },
        orderBy: { _count: { payment_method: "desc" } }
    });

    res.json(paymentMethods.map(pm => ({
        method: pm.payment_method,
        count: pm._count.payment_method
    })));
});

exports.getTopProducts = asyncHandler(async (req, res) => {
    const topProducts = await prisma.saleDetails.groupBy({
        by: ["id_product"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5
    });

    const products = await prisma.products.findMany({
        where: { id_product: { in: topProducts.map(p => p.id_product) } },
        select: { id_product: true, name: true, sku: true }
    });

    const response = topProducts.map(p => {
        const product = products.find(prod => prod.id_product === p.id_product);
        return {
            id_product: p.id_product,
            name: product?.name || "Desconocido",
            sku: product?.sku || "N/A",
            total_sold: p._sum.quantity
        };
    });

    res.json(response);
});

exports.getTopUsers = asyncHandler(async (req, res) => {
    const topUsers = await prisma.sales.groupBy({
        by: ["id_user"],
        _count: { id_sale: true },
        _sum: { total: true },
        where: { status: { not: "FULLY_RETURNED" } },
        orderBy: { _sum: { total: "desc" } },
        take: 5
    });

    const users = await prisma.users.findMany({
        where: { id_user: { in: topUsers.map(u => u.id_user) } },
        select: { id_user: true, name: true, role: true }
    });

    const response = topUsers.map(u => {
        const user = users.find(user => user.id_user === u.id_user);
        return {
            id_user: u.id_user,
            name: user?.name || "Desconocido",
            role: user?.role || "N/A",
            total_sales: u._count.id_sale,
            total_sold: u._sum.total
        };
    });

    res.json(response);
});

exports.getTopCustomers = asyncHandler(async (req, res) => {
    const topCustomers = await prisma.sales.groupBy({
        by: ["id_customer"],
        _count: { id_sale: true },
        _sum: { total: true },
        where: { status: { not: "FULLY_RETURNED" } },
        orderBy: { _sum: { total: "desc" } },
        take: 5
    });

    const customers = await prisma.customers.findMany({
        where: { id_customer: { in: topCustomers.map(c => c.id_customer) } },
        select: { id_customer: true, name: true, first_surname: true, second_surname: true }
    });

    const response = topCustomers.map(c => {
        const customer = customers.find(customer => customer.id_customer === c.id_customer);
        return {
            id_customer: c.id_customer,
            name: getFullName(customer),
            total_purchases: c._count.id_sale,
            total_spent: c._sum.total
        };
    });

    res.json(response);
});

exports.getSalesTrend = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = getThirtyDaysAgo();

    const sales = await prisma.sales.findMany({
        where: {
            status: { not: "FULLY_RETURNED" },
            date: { gte: thirtyDaysAgo }
        },
        select: { date: true, total: true }
    });

    const dailyMap = {};
    for (const s of sales) {
        const day = s.date.toISOString().split('T')[0];
        dailyMap[day] = (dailyMap[day] || 0) + s.total;
    }

    const trend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, total]) => ({ day, total }));

    res.json(trend);
});

exports.getLowStock = asyncHandler(async (req, res) => {
    const threshold = parseInt(req.query.threshold) || 5;

    const products = await prisma.products.findMany({
        select: { id_product: true, name: true, sku: true }
    });

    const productIds = products.map(p => p.id_product);
    const movements = await prisma.stockMovements.groupBy({
        by: ["id_product"],
        _sum: { quantity: true },
        where: { id_product: { in: productIds } }
    });

    const stockMap = {};
    for (const m of movements) {
        stockMap[m.id_product] = m._sum.quantity || 0;
    }

    const lowStock = products
        .map(p => ({
            id_product: p.id_product,
            name: p.name,
            sku: p.sku || "N/A",
            stock: stockMap[p.id_product] || 0
        }))
        .filter(p => p.stock <= threshold)
        .sort((a, b) => a.stock - b.stock);

    res.json(lowStock);
});

exports.getSalesByCategory = asyncHandler(async (req, res) => {
    const categories = await prisma.categories.findMany({
        select: { id_category: true, name: true }
    });

    const saleDetails = await prisma.saleDetails.findMany({
        select: {
            quantity: true,
            unit_price: true,
            product: { select: { id_category: true } },
            sale: { select: { id_sale: true, status: true } }
        }
    });

    const categoryMap = {};
    const saleIds = new Set();
    for (const sd of saleDetails) {
        if (sd.sale.status === "FULLY_RETURNED") continue;
        const catId = sd.product.id_category;
        if (!categoryMap[catId]) categoryMap[catId] = { total: 0, sales_count: new Set() };
        categoryMap[catId].total += sd.quantity * sd.unit_price;
        categoryMap[catId].sales_count.add(sd.sale.id_sale);
    }

    const result = categories
        .map(c => ({
            category: c.name,
            total: categoryMap[c.id_category]?.total || 0,
            sales_count: categoryMap[c.id_category]?.sales_count.size || 0
        }))
        .filter(c => c.total > 0)
        .sort((a, b) => b.total - a.total);

    res.json(result);
});

exports.getReturnsRate = asyncHandler(async (req, res) => {
    const raw = await prisma.$queryRawUnsafe(`
        SELECT
            COUNT(*) FILTER (WHERE status = 'FULLY_RETURNED') AS fully_returned_count,
            COUNT(*) AS total_count,
            COALESCE(SUM(total) FILTER (WHERE status = 'FULLY_RETURNED'), 0) AS fully_returned_amount,
            COALESCE(SUM(total), 0) AS total_amount
        FROM "Sales"
    `);

    const row = raw[0];
    const totalCount = Number(row.total_count) || 0;
    const fullyReturnedCount = Number(row.fully_returned_count) || 0;
    const totalAmount = Number(row.total_amount) || 0;
    const fullyReturnedAmount = Number(row.fully_returned_amount) || 0;

    res.json({
        fully_returned_count: fullyReturnedCount,
        total_count: totalCount,
        fully_returned_amount: fullyReturnedAmount,
        total_amount: totalAmount,
        returns_rate: totalCount > 0 ? (fullyReturnedCount / totalCount) * 100 : 0,
        amount_rate: totalAmount > 0 ? (fullyReturnedAmount / totalAmount) * 100 : 0
    });
});
