const normalizeSearchTerm = (term) => {
    if (!term) return "";
    return term
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const getFullName = (customer) => {
    if (!customer) return "Desconocido";
    return `${customer.name} ${customer.first_surname} ${customer.second_surname}`.trim();
};

const accentInsensitiveWhere = (column) => {
    return `LOWER(translate(${column}, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN')) ILIKE LOWER($1)`;
};

module.exports = { normalizeSearchTerm, getFullName, accentInsensitiveWhere };
