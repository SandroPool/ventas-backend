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

    const raw = await prisma.$queryRawUnsafe(`
        SELECT DATE(s.date) AS day, COALESCE(SUM(s.total), 0) AS total
        FROM "Sales" s
        WHERE s.status != 'FULLY_RETURNED' AND s.date >= $1
        GROUP BY DATE(s.date)
        ORDER BY day ASC
    `, thirtyDaysAgo);

    const trend = (raw || []).map((r) => ({
        day: r.day.toISOString().split('T')[0],
        total: Number(r.total)
    }));

    res.json(trend);
});

exports.getLowStock = asyncHandler(async (req, res) => {
    const threshold = parseInt(req.query.threshold) || 5;

    const raw = await prisma.$queryRawUnsafe(`
        SELECT p.id_product, p.name, p.sku, COALESCE(SUM(sm.quantity), 0) AS stock
        FROM "Products" p
        LEFT JOIN "StockMovements" sm ON sm.id_product = p.id_product
        GROUP BY p.id_product, p.name, p.sku
        HAVING COALESCE(SUM(sm.quantity), 0) <= $1
        ORDER BY stock ASC
    `, threshold);

    const products = (raw || []).map((r) => ({
        id_product: r.id_product,
        name: r.name,
        sku: r.sku || "N/A",
        stock: Number(r.stock)
    }));

    res.json(products);
});

exports.getSalesByCategory = asyncHandler(async (req, res) => {
    const raw = await prisma.$queryRawUnsafe(`
        SELECT c.name AS category,
               COALESCE(SUM(sd.quantity * sd.unit_price), 0) AS total,
               COUNT(DISTINCT s.id_sale) AS sales_count
        FROM "Categories" c
        LEFT JOIN "Products" p ON p.id_category = c.id_category
        LEFT JOIN "SaleDetails" sd ON sd.id_product = p.id_product
        LEFT JOIN "Sales" s ON s.id_sale = sd.id_sale AND s.status != 'FULLY_RETURNED'
        GROUP BY c.id_category, c.name
        HAVING COALESCE(SUM(sd.quantity * sd.unit_price), 0) > 0
        ORDER BY total DESC
    `);

    const categories = (raw || []).map((r) => ({
        category: r.category,
        total: Number(r.total),
        sales_count: Number(r.sales_count)
    }));

    res.json(categories);
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
