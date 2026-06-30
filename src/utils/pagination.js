const parsePagination = (query) => {
    const { page = 1, limit = 10 } = query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;
    return { page: pageNumber, limit: limitNumber, skip };
};

module.exports = { parsePagination };
