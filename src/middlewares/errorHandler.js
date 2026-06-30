const { logger } = require("../utils");

module.exports = (err, req, res, next) => {
    logger.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";
    res.status(statusCode).json({ error: message });
};
