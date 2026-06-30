const prisma = require("../configs/prisma");
const { asyncHandler, parsePagination, normalizeSearchTerm, paginatedResponse, logger } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let customers = [];
    let totalCustomers = 0;

    if (searchTerm) {
        const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

        const query = `
            SELECT * FROM "Customers"
            WHERE 
                LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(first_surname, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(second_surname, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(dni, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
            ORDER BY "createdAt" DESC
            LIMIT $2 OFFSET $3
        `;

        customers = await prisma.$queryRawUnsafe(
            query,
            `%${normalizedSearchTerm}%`,
            limit,
            skip
        );

        const countQuery = `
            SELECT COUNT(*) as total FROM "Customers"
            WHERE 
                LOWER(translate(name, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(first_surname, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(second_surname, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1) OR
                LOWER(translate(dni, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
        totalCustomers = parseInt(totalResult[0].total);
    } else {
        totalCustomers = await prisma.customers.count();
        customers = await prisma.customers.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }

    res.json(paginatedResponse(customers, totalCustomers, page, limit));
});

exports.create = asyncHandler(async (req, res) => {
    const { name, first_surname, second_surname, dni } = req.body;

    const existingCustomer = await prisma.customers.findUnique({ where: { dni } });
    if (existingCustomer) {
        return res.status(400).json({ error: "El DNI ya está registrado" });
    }

    const newCustomer = await prisma.customers.create({
        data: { name, first_surname, second_surname, dni }
    });

    res.status(201).json(newCustomer);
});

exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, first_surname, second_surname, dni } = req.body;

    const customer = await prisma.customers.findUnique({
        where: { id_customer: parseInt(id) }
    });

    if (!customer) {
        return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const updatedCustomer = await prisma.customers.update({
        where: { id_customer: parseInt(id) },
        data: { name, first_surname, second_surname, dni }
    });

    res.json(updatedCustomer);
});

const fetchExternalCustomer = async (dni) => {
    try {
        const apiUrl = process.env.URL_API_PERU;
        const apiToken = process.env.TOKEN_API_PERU;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiToken}`
            },
            body: JSON.stringify({ dni })
        });

        if (!response.ok) {
            logger.error("Error en API externa:", { status: response.status, statusText: response.statusText });
            return null;
        }

        const apiData = await response.json();

        if (apiData.success && apiData.data?.nombres) {
            return {
                dni,
                name: apiData.data.nombres,
                first_surname: apiData.data.apellido_paterno,
                second_surname: apiData.data.apellido_materno
            };
        }
        return null;
    } catch (error) {
        logger.error("Error al conectar con la API externa:", error);
        return null;
    }
};

exports.searchByDni = asyncHandler(async (req, res) => {
    const { dni } = req.query;

    let customer = await prisma.customers.findUnique({ where: { dni } });

    if (customer) {
        return res.json({ found: true, source: "local", data: customer });
    }

    const externalCustomer = await fetchExternalCustomer(dni);

    if (externalCustomer) {
        customer = await prisma.customers.create({
            data: externalCustomer
        });

        return res.json({ found: true, source: "external", data: customer });
    }

    return res.json({ found: false, message: "Datos no encontrados, registrar manualmente" });
});
