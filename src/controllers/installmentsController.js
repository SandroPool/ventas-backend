const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, assertExists } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let installments = [];
    let total = 0;

    if (searchTerm.trim()) {
        const normalizedSearch = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT i.*, s.operation_number, c.name AS customer_name
            FROM "Installments" i
            LEFT JOIN "Sales" s ON i.id_sale = s.id_sale
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            WHERE 
                LOWER(translate(s.operation_number, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY i."createdAt" DESC
            LIMIT $2 OFFSET $3
        `;
        installments = await prisma.$queryRawUnsafe(query, `%${normalizedSearch}%`, limit, skip);

        const countQuery = `
            SELECT COUNT(*) AS total FROM "Installments" i
            LEFT JOIN "Sales" s ON i.id_sale = s.id_sale
            LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
            WHERE 
                LOWER(translate(s.operation_number, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(c.name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearch}%`);
        total = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
    } else {
        total = await prisma.installments.count();
        installments = await prisma.installments.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                sale: { select: { operation_number: true } }
            }
        });
    }

    res.json(paginatedResponse(installments, total, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { id_sale, installments } = req.body;

    await assertExists(prisma, 'sales', 'id_sale', id_sale, "La venta no existe");

    const created = await prisma.installments.createMany({
        data: installments.map(inst => ({
            id_sale,
            amount: inst.amount,
            due_date: new Date(inst.due_date)
        }))
    });

    res.status(201).json({ count: created.count });
});

exports.pay = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const installment = await prisma.installments.findUnique({ where: { id_installment: parseInt(id) } });
    if (!installment) {
        return res.status(404).json({ error: "Cuota no encontrada" });
    }
    if (installment.paid) {
        return res.status(400).json({ error: "La cuota ya está pagada" });
    }

    const updated = await prisma.installments.update({
        where: { id_installment: parseInt(id) },
        data: { paid: true, paid_date: new Date() }
    });

    res.json(updated);
});

exports.getBySale = asyncHandler(async (req, res) => {
    const { id_sale } = req.params;
    const installments = await prisma.installments.findMany({
        where: { id_sale: parseInt(id_sale) },
        orderBy: { due_date: "asc" }
    });

    res.json(installments);
});
