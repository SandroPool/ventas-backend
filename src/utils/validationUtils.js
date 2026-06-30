const assertExists = async (prisma, model, field, value, message) => {
    const record = await prisma[model].findUnique({
        where: { [field]: value },
    });
    if (!record) {
        const err = new Error(message);
        err.statusCode = 404;
        throw err;
    }
    return record;
};

const validatePositiveNumber = (value, fieldName) => {
    if (value === undefined || value === null || value <= 0) {
        const err = new Error(`${fieldName} debe ser mayor a 0`);
        err.statusCode = 400;
        throw err;
    }
};

module.exports = { assertExists, validatePositiveNumber };
