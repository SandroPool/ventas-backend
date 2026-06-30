const paginatedResponse = (data, total, page, limit) => ({
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit),
    data,
});

module.exports = { paginatedResponse };
