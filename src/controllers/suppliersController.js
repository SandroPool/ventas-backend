const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, assertExists } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let suppliers = [];
    let totalSuppliers = 0;

    if (searchTerm) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT * FROM "Suppliers"
            WHERE 
                LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(ruc, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(contact, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY "createdAt" DESC
            LIMIT $2 OFFSET $3
        `;

        suppliers = await prisma.$queryRawUnsafe(
            query,
            `%${normalizedSearchTerm}%`,
            limit,
            skip
        );

        const countQuery = `
            SELECT COUNT(*) as total FROM "Suppliers"
            WHERE 
                LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(ruc, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(contact, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
        totalSuppliers = parseInt(totalResult[0].total);
    } else {
        totalSuppliers = await prisma.suppliers.count();
        suppliers = await prisma.suppliers.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }

    res.json(paginatedResponse(suppliers, totalSuppliers, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { name, ruc, contact, phone, address } = req.body;

    const newSupplier = await prisma.suppliers.create({
        data: { name, ruc, contact, phone, address },
    });

    res.status(201).json(newSupplier);
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, ruc, contact, phone, address } = req.body;

    await assertExists(prisma, 'suppliers', 'id_supplier', parseInt(id), "Proveedor no encontrado");

    const updatedSupplier = await prisma.suppliers.update({
        where: { id_supplier: parseInt(id) },
        data: { name, ruc, contact, phone, address },
    });

    res.json(updatedSupplier);
});
