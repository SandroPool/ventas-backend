const logger = require("./logger");
const { asyncHandler } = require("./asyncHandler");
const { parsePagination } = require("./pagination");
const { normalizeSearchTerm, getFullName, accentInsensitiveWhere } = require("./stringUtils");
const { paginatedResponse } = require("./responseFormatter");
const { getProductStock, getProductsStock, recordStockIn, recordStockOut } = require("./stockUtils");
const { validatePositiveNumber, assertExists } = require("./validationUtils");
const { parseId } = require("./requestUtils");
const { getDateRanges, getThirtyDaysAgo } = require("./dateUtils");

module.exports = {
    logger,
    asyncHandler,
    parsePagination,
    normalizeSearchTerm,
    getFullName,
    accentInsensitiveWhere,
    paginatedResponse,
    getProductStock,
    getProductsStock,
    recordStockIn,
    recordStockOut,
    validatePositiveNumber,
    assertExists,
    parseId,
    getDateRanges,
    getThirtyDaysAgo,
};
